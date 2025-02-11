<script lang="ts">
  import { onMount, afterUpdate, beforeUpdate } from "svelte";
  import * as fabric from "fabric";
    import type { Facet } from "@atproto/api";

  export let drawingData: App.Path[] = [];
  export let readonly: boolean = false;
  export const userDid: string | null = null;

  let canvas: fabric.Canvas;
  let undoStack: any[] = [];
  let redoStack: any[] = [];
  let currentColor = "#000000";
  let currentSize = 5;
  let isErasing = false;
  let initialState: any = null; // 初期データの状態を保存

  /**
   * 初回マウント時の処理
   */
  onMount(() => {
    canvas = new fabric.Canvas("drawingCanvas", {
      isDrawingMode: !readonly, // readonlyなら描画モードをオフ
    });

    loadDrawingData();

    // 初期ブラシ設定
    if (!canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    }
    canvas.freeDrawingBrush.color = currentColor;
    canvas.freeDrawingBrush.width = currentSize;

    // 初期状態を保存（アンドゥ対象外）
    initialState = canvas.toJSON();
    undoStack.push(initialState);

    // 描画完了時の履歴保存
    canvas.on("object:added", () => {
      if (!readonly) {
        saveState();
      }
    });
  });

  /**
   * 描画データをFabric.jsのCanvasに適用
   */
  function loadDrawingData() {
    if (!canvas) return;

    canvas.clear(); // 既存の描画をクリア

    let pathData: string[] = [];
    let lastPath: fabric.Path | null = null;

    drawingData.forEach(({ x, y, color, size, isNewStroke }) => {
      if (isNewStroke || !lastPath) {
        // 新しいパスを作成
        pathData = [`M ${x} ${y}`];
        lastPath = new fabric.Path(pathData.join(" "), {
          stroke: color,
          strokeWidth: size,
          fill: "transparent",
          selectable: false,
          evented: false,
        });
        canvas.add(lastPath);
      } else {
        // 既存のパスを削除して新しいパスを作成
        pathData.push(`L ${x} ${y}`);
        canvas.remove(lastPath); // 既存のパスを削除
        lastPath = new fabric.Path(pathData.join(" "), {
          stroke: color,
          strokeWidth: size,
          fill: "transparent",
          selectable: false,
          evented: false,
        });
        canvas.add(lastPath);
      }
    });

    canvas.renderAll();
  }

  /**
   * アンドゥ（Ctrl + Z）
   */
  const undo = () => {
    if (undoStack.length > 1) {
      redoStack.push(undoStack.pop());
      canvas.loadFromJSON(undoStack[undoStack.length - 1], canvas.renderAll.bind(canvas));
    }
  };

  /**
   * リドゥ（Ctrl + Y）
   */
  const redo = () => {
    if (redoStack.length) {
      undoStack.push(redoStack.pop());
      canvas.loadFromJSON(undoStack[undoStack.length - 1], canvas.renderAll.bind(canvas));
    }
  };

  /**
   * ペンの太さ変更
   */
   const changeSize = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const size = target?.valueAsNumber;
    if (size && canvas.freeDrawingBrush) {
      currentSize = size;
      canvas.freeDrawingBrush.width = size;
    }
  };

  /**
   * 色変更
   */
  const changeColor = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target) {
      currentColor = target.value;
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = currentColor;
      }
    }
  };

  /**
   * 消しゴムモード切り替え
   */
  const toggleEraser = () => {
    isErasing = !isErasing;
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = isErasing ? "white" : currentColor;
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

  /**
   * 描画データを保存（変更があるたびに実行）
   */
  const saveState = () => {
    if (!readonly) {
      undoStack.push(canvas.toJSON());
      redoStack = [];
    }
  };

  window.addEventListener("keydown", handleKeyDown);
</script>

<canvas id="drawingCanvas" width="300" height="500" class="border-2"></canvas>

<!-- 操作パネル -->
<div class="flex gap-2 mt-2">
  <button on:click={undo} disabled={readonly}>アンドゥ (Ctrl+Z)</button>
  <button on:click={redo} disabled={readonly}>リドゥ (Ctrl+Y)</button>
  <button on:click={toggleEraser} disabled={readonly}>{isErasing ? "ペン" : "消しゴム"}</button>
  <input type="range" min="1" max="20" value={currentSize} on:input={(e) => changeSize(e)} disabled={readonly} />
  <input type="color" value={currentColor} on:input={(e) => changeColor(e)} disabled={readonly} />
</div>
