<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as fabric from "fabric";

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
  let undoStack: string[] = [];
  let redoStack: string[] = [];
  let lockHistory = false; // Undo/Redo/Loading中にSaveさせないためのフラグ
  let isEraser = $state(false);
  let lastColor = "#000000"; // 最後に使っていた色を保存
  let currentColor = $state("#000000"); // 現在選択されている色

  /**
   * 初回マウント時の処理
   */
  onMount(async () => {
    drawingCanvas = new fabric.Canvas("drawingCanvas");
    drawingCanvas.isDrawingMode = !readOnly;
    backgroundCanvas = new fabric.StaticCanvas("backgroundCanvas");

    fabric.FabricObject.ownDefaults.objectCaching = false; // 軽量化処理: オブジェクトキャッシュを無効化

    // ペンの初期設定
    if (!drawingCanvas.freeDrawingBrush) {
      const initialBrush = new fabric.PencilBrush(drawingCanvas);
      initialBrush.color = "#000000";
      initialBrush.width = 5;
      drawingCanvas.freeDrawingBrush = initialBrush;
    }

    // myDrawingDataとothersDrawingDataを読み込む
    await loadAllDrawings();

    // 初期状態をスタックに保存
    undoStack.push(drawingCanvas.toJSON());

    // 描画変更時にデータ保存
    drawingCanvas.on("object:modified", saveState);
    drawingCanvas.on("object:added", saveState);

    // パスが作成されたときに、消しゴムモードであれば交差するオブジェクトを削除
    drawingCanvas.on("path:created", (e) => {
      console.log("path:created event fired", e.path);
      if (isEraser && e.path) {
        const newPath = e.path;
        const objectsToRemove: fabric.Object[] = [];

        drawingCanvas.forEachObject((obj) => {
          // 新しく描かれたパス自身は対象外
          if (obj !== newPath && newPath.intersectsWithObject(obj)) {
            objectsToRemove.push(obj);
          }
        });

        console.log("Objects to remove:", objectsToRemove);
        objectsToRemove.forEach((obj) => {
          drawingCanvas.remove(obj);
        });
        drawingCanvas.requestRenderAll(); // 削除後に再描画
      }
      saveState(); // パスが作成された後も状態を保存
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

    backgroundCanvas.renderOnAddRemove = false; // 軽量化処理: 追加時の再描画を一時無効化
    await mergeAllCanvasData(backgroundCanvas, pastDrawingData || []);
    backgroundCanvas.renderOnAddRemove = true;
    backgroundCanvas.requestRenderAll();

    if (myDrawingData) {
      drawingCanvas.renderOnAddRemove = false; // 軽量化処理: 追加時の再描画を一時無効化
      await mergeAllCanvasData(drawingCanvas, [myDrawingData]);
      drawingCanvas.renderOnAddRemove = true;
      drawingCanvas.requestRenderAll();
    }

    lockHistory = false;
  };

  /**
   * JSONデータをCanvasに統合する関数
   * @param jsonData 統合するJSONデータ
   */
  const mergeAllCanvasData = async (
    canvas: fabric.StaticCanvas,
    pastDrawingData: string[]
  ) => {
    try {
      if (!pastDrawingData || pastDrawingData.length === 0) return;

      let mergedObjects: fabric.Object[] = [];

      // すべてのデータを統合
      for (const data of pastDrawingData) {
        const parsedData = JSON.parse(data);
        if (parsedData.objects) {
          mergedObjects = mergedObjects.concat(filterObjects(parsedData.objects));
        }
      }

      // 統合データをJSON化
      const mergedJSON = JSON.stringify({ objects: mergedObjects });

      // 統合したデータを一括適用
      await new Promise<void>((resolve) => {
        canvas.loadFromJSON(mergedJSON, () => {
          resolve();
        });
      });

    } catch (error) {
      console.error("Error merging drawings:", error);
    }
  };

  /**
   * 描画不要なオブジェクトをフィルタリング
   * @param objects
   */
  const filterObjects = (objects: fabric.FabricObject[]) => {
    return objects.filter(obj => {
      // 透明なオブジェクトは除外
      if (obj.stroke === "white" || obj.stroke === "#ffffff") return false;
      // 極端に小さいオブジェクトも除外
      if (obj.width !== undefined && obj.height !== undefined) {
        if (obj.width < 2 && obj.height < 2) return false;
      }
      return true;
    });
  };

  /**
   * 描画データを保存
   */
  const saveState = async () => {
    if (!readOnly && !lockHistory) {
      const myDrawingObjs = drawingCanvas.getObjects();
      const filteredDrawingObjs = filterObjects(myDrawingObjs);

      myDrawingData = fabricObjectsToJSON(filteredDrawingObjs); 

      undoStack.push(myDrawingData);
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
    const newColor = (e.target as HTMLInputElement).value;

    if (drawingCanvas.freeDrawingBrush) {
      drawingCanvas.freeDrawingBrush.color = newColor;
      lastColor = newColor; // 色を変更したら保存
      currentColor = newColor;
    }
  };

  /**
   * 消しゴムモード切り替え
   */
  const toggleEraser = () => {
    if (drawingCanvas.freeDrawingBrush) {
      if (!isEraser) {
        // 消しゴムにする前に元の色を保存
        lastColor = drawingCanvas.freeDrawingBrush.color;
        drawingCanvas.freeDrawingBrush.color = "#ffffff"; // 白に設定
        currentColor = "#ffffff";
      } else {
        // 消しゴム解除時に元の色に戻す
        drawingCanvas.freeDrawingBrush.color = lastColor;
        currentColor = lastColor;
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
      <input type="color" bind:value={currentColor} oninput={changeColor} disabled={isEraser} />
    </div>
  {/if}
</div>
