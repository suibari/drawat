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
    if (!pastDrawingData || !canvas) return;

    for (const data of pastDrawingData) {
      try {
        lockHistory = true;
        // `fabric.js` の JSON 形式なら通常通り適用
        await new Promise((resolve) => {
          canvas.loadFromJSON(data, () => {
            canvas.getObjects().forEach(obj => {
              obj.set("pastDrawingData", true);
            });
            canvas.requestRenderAll();
            resolve(true);
          });
        });
        setTimeout(() => (lockHistory = false), 0); // setTimeoutで非同期実行し、完全に描画が終わった後に解除。こうしないとダメ
      } catch (error) {
        console.error("Error loading past drawing:", error);
      }
    }
  };

  /**
   * 描画データを保存
   */
  const saveState = async () => {
    if (!readOnly && !lockHistory) {
      const tmpCanvas = new fabric.Canvas('tmpCanvas');
      const drawableObjects = canvas.getObjects().filter(obj => obj.get("pastDrawingData") !== true);
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
      <button class="button-sky" onclick={toggleEraser}>Eraser</button>
      <p class="font-semibold">Blush Size:</p>
      <input type="range" min="1" max="20" value="5" oninput={changeSize} />
      <p class="font-semibold">Color Picker:</p>
      <input type="color" value="#000000" oninput={changeColor} />
    </div>
  {/if}
</div>
