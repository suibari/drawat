<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as fabric from "fabric";

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
    await saveState();

    // 描画変更時にデータ保存
    canvas.on("object:added", saveState);
    canvas.on("object:modified", saveState);
  });

  onDestroy(() => {
    canvas.dispose();
  });

  /**
   * すべての過去データをCanvasに適用
   */
  export const loadPastDrawings = async () => {
    if (!canvas) return;

    lockHistory = true;
    
    // `myDrawingData` がある場合は適用
    if (myDrawingData) {
      await loadCanvasFromJSON(myDrawingData, false);
    } else {
      canvas.clear();
    }

    // すべての過去データを適用
    for (const data of pastDrawingData || []) {
      await loadCanvasFromJSON(data, true);
    }


    lockHistory = false; // なぜかここは非同期だとうまくいかない…
  };

  /**
   * JSONデータをCanvasに適用する関数
   * @param jsonData 適用するJSONデータ
   * @param isOhtersData `true`ならothersDrawingDataを付与
   */
  const loadCanvasFromJSON = async (jsonData: string, isOhtersData: boolean) => {
    try {
      await new Promise((resolve) => {
        canvas.loadFromJSON(jsonData, () => {
          if (isOhtersData) {
            canvas.getObjects().forEach(obj => obj.set("othersDrawingData", true));
          }
          canvas.requestRenderAll();
          setTimeout(resolve, 0); // 初期画像を表示してからsaveStateを行うため、レンダリング完了を確実に待つ
        });
      });
    } catch (error) {
      console.error("Error loading drawing:", error);
    }
  };

  /**
   * 描画データを保存
   */
  const saveState = async () => {
    if (!readOnly && !lockHistory) {
      const tmpCanvas = new fabric.Canvas('tmpCanvas');
      const drawableObjects = canvas.getObjects().filter(obj => obj.get("othersDrawingData") !== true);
      const clonedObjects = await Promise.all(drawableObjects.map(obj => obj.clone()));
      clonedObjects.forEach(clonedObj => tmpCanvas.add(clonedObj));
      const newState = JSON.stringify(tmpCanvas);

      undoStack.push(newState);
      myDrawingData = newState;

      redoStack = []; // アンドゥ後のリドゥ履歴をリセット
    }
  };

  /**
   * アンドゥ（Ctrl + Z）
   */
  const undo = () => {
    if (undoStack.length > 1) {
      lockHistory = true;
      redoStack.push(undoStack.pop()!);
      const content = undoStack[undoStack.length - 1];

      canvas.loadFromJSON(content, () => {
        canvas.requestRenderAll(); // renderAllだとうまくいかない
        setTimeout(() => (lockHistory = false), 0); // setTimeoutで非同期実行し、完全に描画が終わった後に解除。こうしないとダメ
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

      canvas.loadFromJSON(content, () => {
        canvas.requestRenderAll(); // renderAllだとうまくいかない
        setTimeout(() => (lockHistory = false), 0); // setTimeoutで非同期実行し、完全に描画が終わった後に解除。こうしないとダメ
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
    }
  };

  /**
   * 消しゴムモード切り替え
   */
  const toggleEraser = () => {
    if (canvas.freeDrawingBrush) {
      isEraser = !isEraser;
      canvas.freeDrawingBrush.color = canvas.freeDrawingBrush.color === "white" ? "#000000" : "white";
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
