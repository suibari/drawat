<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as fabric from "fabric";
  import { EraserBrush, ClippingGroup } from '@erase2d/fabric';

  const MAX_STACK_SIZE = 10;

  let {
    pastDrawingData,
    myDrawingData = $bindable(),
    readOnly,
  }: {
    pastDrawingData: string[] | null
    myDrawingData: string | undefined
    readOnly: boolean
  } = $props();

  let drawingCanvas: fabric.Canvas;
  let backgroundCanvas: fabric.StaticCanvas;
  let eraser: EraserBrush;
  let undoStack: string[] = [];
  let redoStack: string[] = [];
  let lockHistory = false; // Undo/Redo/Loading中にSaveさせないためのフラグ
  let isEraser = $state(false);
  let lastColor = "#000000"; // 最後に使っていた色を保存
  let lastBrush: fabric.BaseBrush | undefined; // 消しゴムにする前のブラシを保存

  /**
   * 初回マウント時の処理
   */
  onMount(async () => {
    drawingCanvas = new fabric.Canvas("drawingCanvas");
    drawingCanvas.isDrawingMode = true;
    backgroundCanvas = new fabric.StaticCanvas("backgroundCanvas");

    // 消しゴムインスタンス
    eraser = new EraserBrush(drawingCanvas);
    eraser.width = 30;

    // ペンの初期設定
    if (!drawingCanvas.freeDrawingBrush) {
      drawingCanvas.freeDrawingBrush = new fabric.PencilBrush(drawingCanvas);
      drawingCanvas.freeDrawingBrush.color = "#000000";
      drawingCanvas.freeDrawingBrush.width = 5;
    }

    // myDrawingDataは消しゴムで消せる
    if (myDrawingData) {
      const objs = JSON.parse(myDrawingData).objects;
      objs.forEach((obj: fabric.Object) => {
        obj.erasable = true;
      });
      myDrawingData = JSON.stringify({ objects: objs });
    }
    console.log("myDrawingData", myDrawingData?.length);

    // myDrawingDataとothersDrawingDataを読み込む
    await loadAllDrawings();

    // 初期状態をスタックに保存
    undoStack.push(drawingCanvas.toJSON());

    // 描画変更時にデータ保存
    drawingCanvas.on("object:modified", saveState);
    drawingCanvas.on("object:added", saveState);

    // 新規に描いたオブジェクトは消しゴムで消せる
    drawingCanvas.on("object:added", (e) => {
      e.target.erasable = true;
    });
  });

  onDestroy(() => {
    drawingCanvas.dispose();
    backgroundCanvas.dispose();
  });

  /**
   * すべての過去データをCanvasに適用（統合処理）
   */
  const loadAllDrawings = async () => {
    lockHistory = true;
    
    for (const data of pastDrawingData || []) {
      await mergeCanvasFromJSON(backgroundCanvas, data, true);
    }

    if (myDrawingData) {
      await mergeCanvasFromJSON(drawingCanvas, myDrawingData, false);
    }

    backgroundCanvas.requestRenderAll();
    drawingCanvas.requestRenderAll();
    lockHistory = false;
  };

  /**
   * JSONデータをCanvasに統合する関数（オブジェクト単位）
   * @param jsonData 統合するJSONデータ
   */
  const mergeCanvasFromJSON = async (canvas: fabric.Canvas|fabric.StaticCanvas, jsonData: string, isOthersData: boolean) => {
    try {
      const tmpCanvas = new fabric.StaticCanvas(undefined); // 描画用のDOM要素なし
      await new Promise((resolve) => {
        tmpCanvas.loadFromJSON(jsonData)
          .then(() => {
            const objs = tmpCanvas.getObjects();
            objs.forEach((obj) => {
              obj.set("othersDrawingData", isOthersData);
              canvas.add(obj); // 既存キャンバスに追加
            });
            resolve(null);
          });
      });
    } catch (error) {
      console.error("Error merging drawing:", error);
    }
  };

  /**
   * 描画データを保存
   */
  const saveState = async () => {
    if (!readOnly && !lockHistory) {
      const allDrawingObjs = drawingCanvas.getObjects();
      const myDrawingObjs = allDrawingObjs.filter(obj => obj.get("othersDrawingData") !== true);

      const newState = fabricObjectsToJSON(allDrawingObjs);
      myDrawingData = fabricObjectsToJSON(myDrawingObjs); 

      undoStack.push(newState);
      if (undoStack.length > MAX_STACK_SIZE) {
        undoStack.shift();
      }

      redoStack = []; // アンドゥ後のリドゥ履歴をリセット
    }
  };

  /**
   * FabricオブジェクトをJSONに変換
   * @param objs
   */
  const fabricObjectsToJSON = (objs: fabric.FabricObject[]) => {
    return JSON.stringify({ objects: objs.map(obj => obj.toObject()) });
  };

  /**
   * 自分の描画をクリア
   */
  export const deleteMyDrawing = () => {
    if (!readOnly) {
      drawingCanvas.clear();
    }
  }

  /**
   * アンドゥ（Ctrl + Z）
   */
  const undo = () => {
    if (undoStack.length > 1) {
      lockHistory = true;
      redoStack.push(undoStack.pop()!);

      // リドゥスタックがオーバーしたら古いものを削除
      if (redoStack.length > MAX_STACK_SIZE) {
        redoStack.shift();
      }

      const content = undoStack[undoStack.length - 1];
      drawingCanvas.loadFromJSON(content, () => {
        drawingCanvas.requestRenderAll();
        setTimeout(() => (lockHistory = false), 0);
      });
    }
  };


  /**
   * リドゥ（Ctrl + Y）
   */
  const redo = () => {
    if (redoStack.length > 0) {
      lockHistory = true;
      const content = redoStack.pop()!;
      undoStack.push(content);

      // アンドゥスタックがオーバーしたら古いものを削除
      if (undoStack.length > MAX_STACK_SIZE) {
        undoStack.shift();
      }

      drawingCanvas.loadFromJSON(content, () => {
        drawingCanvas.requestRenderAll();
        setTimeout(() => (lockHistory = false), 0);
      });
    }
  };

  /**
   * ペンの太さ変更
   */
  const changeSize = (e: Event) => {
    const size = (e.target as HTMLInputElement).valueAsNumber;
    if (drawingCanvas.freeDrawingBrush) {
      drawingCanvas.freeDrawingBrush.width = size;
    }
  };

  /**
   * 色変更
   */
  const changeColor = (e: Event) => {
    const color = (e.target as HTMLInputElement).value;
    if (drawingCanvas.freeDrawingBrush) {
      drawingCanvas.freeDrawingBrush.color = color;
      lastColor = color; // 色を変更したら保存
    }
  };

  /**
   * 消しゴムモード切り替え
   */
  const toggleEraser = () => {
    if (drawingCanvas.freeDrawingBrush) {
      if (!isEraser) {
        // 消しゴムにする前に元の色を保存
        lastBrush = drawingCanvas.freeDrawingBrush;
        drawingCanvas.freeDrawingBrush = eraser;
      } else {
        // 消しゴム解除時に元の色に戻す
        drawingCanvas.freeDrawingBrush = lastBrush;
      }
      isEraser = !isEraser;
    }
  };

  /**
   * キーボードショートカット
   */
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "z") {
      undo();
    } else if (e.ctrlKey && e.key === "y") {
      redo();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
</script>

<div class="flex flex-col md:flex-row">
  <div class="relative">
    <canvas id="backgroundCanvas" width="300" height="500" class="absolute"></canvas>
    <canvas id="drawingCanvas" width="300" height="500" class="relative"></canvas>
  </div>
  {#if !readOnly}
    <div class="flex flex-col gap-2 mx-2 my-2">
      <button class="button-sky" onclick={undo}>Undo (Ctrl+Z)</button>
      <button class="button-sky" onclick={redo}>Redo (Ctrl+Y)</button>
      <button class="button-sky" onclick={toggleEraser}>{isEraser ? "Switch Blush" : "Switch Eraser"}</button>
      <p class="font-semibold">Stroke Size:</p>
      <input type="range" min="1" max="20" value="5" oninput={changeSize} />
      <p class="font-semibold">Color Picker:</p>
      <input type="color" value="#000000" oninput={changeColor} />
    </div>
  {/if}
</div>
