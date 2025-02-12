<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as fabric from "fabric";
    import { json } from "@sveltejs/kit";

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

  let canvas: fabric.Canvas;
  let undoStack: string[] = [];
  let redoStack: string[] = [];
  let lockHistory = false; // Undo/Redo/Loading中にSaveさせないためのフラグ
  let isEraser = $state(false);
  let lastColor = "#000000"; // 最後に使っていた色を保存

  /**
   * 初回マウント時の処理
   */
  onMount(async () => {
    canvas = new fabric.Canvas("drawingCanvas");
    canvas.isDrawingMode = !readOnly; // readOnlyなら描画不可

    // ペンの初期設定
    if (!canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = "#000000";
      canvas.freeDrawingBrush.width = 5;
    }

    // 過去の描画データを読み込む
    await loadPastDrawings();

    // 初期状態をスタックに保存
    undoStack.push(canvas.toJSON());

    // 描画変更時にデータ保存
    canvas.on("object:added", saveState);
    canvas.on("object:modified", saveState);
  });

  onDestroy(() => {
    canvas.dispose();
  });

  /**
   * すべての過去データをCanvasに適用（統合処理）
   */
  export const loadPastDrawings = async () => {
    if (!canvas) return;

    lockHistory = true;
    
    for (const data of pastDrawingData || []) {
      await mergeCanvasFromJSON(data, true);
    }

    if (myDrawingData) {
      await mergeCanvasFromJSON(myDrawingData, false);
    }

    canvas.requestRenderAll();
    lockHistory = false;
  };

  /**
   * JSONデータをCanvasに統合する関数（オブジェクト単位）
   * @param jsonData 統合するJSONデータ
   */
  const mergeCanvasFromJSON = async (jsonData: string, isOthersData: boolean) => {
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
      const allDrawingObjs = canvas.getObjects();
      const myDrawingObjs = allDrawingObjs.filter(obj => obj.get("othersDrawingData") !== true);

      const newState = fabricObjectsToJSON(allDrawingObjs);
      myDrawingData = fabricObjectsToJSON(myDrawingObjs); 

      console.log(myDrawingData);
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
      canvas.loadFromJSON(content, () => {
        canvas.requestRenderAll();
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

      canvas.loadFromJSON(content, () => {
        canvas.requestRenderAll();
        setTimeout(() => (lockHistory = false), 0);
      });
    }
  };

  /**
   * ペンの太さ変更
   */
  const changeSize = (e: Event) => {
    const size = (e.target as HTMLInputElement).valueAsNumber;
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = size;
    }
  };

  /**
   * 色変更
   */
  const changeColor = (e: Event) => {
    const color = (e.target as HTMLInputElement).value;
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = color;
      lastColor = color; // 色を変更したら保存
    }
  };

  /**
   * 消しゴムモード切り替え
   */
  const toggleEraser = () => {
    if (canvas.freeDrawingBrush) {
      if (!isEraser) {
        // 消しゴムにする前に元の色を保存
        lastColor = canvas.freeDrawingBrush.color as string;
        canvas.freeDrawingBrush.color = "white"; // 消しゴム（背景色）
      } else {
        // 消しゴム解除時に元の色に戻す
        canvas.freeDrawingBrush.color = lastColor;
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
  <canvas id="drawingCanvas" width="300" height="500" class="border-2"></canvas>
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
