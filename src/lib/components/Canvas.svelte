<script lang="ts">
  import { onMount } from 'svelte';

  export let drawingData: App.Path[] = [];
  export let readonly: boolean = false;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let drawing = false;
  let lastX = 0;
  let lastY = 0;
  let currentColor = 'black';
  let currentSize = 5;

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    drawing = true;
    let offsetX: number = 0;
    let offsetY: number = 0;

    if (e instanceof MouseEvent) {
      offsetX = e.offsetX;
      offsetY = e.offsetY;
    } else if (e instanceof TouchEvent) {
      offsetX = e.touches[0].clientX - canvas.offsetLeft;
      offsetY = e.touches[0].clientY - canvas.offsetTop;
    }

    lastX = offsetX;
    lastY = offsetY;

    // 新しいストロークの開始
    drawingData.push({ x: offsetX, y: offsetY, color: currentColor, size: currentSize, isNewStroke: true });
  };

  const stopDrawing = () => {
    drawing = false;
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!drawing || readonly) return;
    let offsetX: number = 0;
    let offsetY: number = 0;

    if (e instanceof MouseEvent) {
      offsetX = e.offsetX;
      offsetY = e.offsetY;
    } else if (e instanceof TouchEvent) {
      offsetX = e.touches[0].clientX - canvas.offsetLeft;
      offsetY = e.touches[0].clientY - canvas.offsetTop;
    }

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(offsetX, offsetY);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();

    drawingData.push({ x: offsetX, y: offsetY, color: currentColor, size: currentSize, isNewStroke: false });

    lastX = offsetX;
    lastY = offsetY;
  };

  // `drawingData` が変更されたときにキャンバスを描画し直す
  $: if (drawingData) {
    redrawCanvas();
  }

  const redrawCanvas = () => {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // キャンバスをクリア

    drawingData.forEach(({ x, y, color, size, isNewStroke }, index) => {
      if (index === 0 || isNewStroke) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else {
        const prev = drawingData[index - 1];
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.stroke();
    });
  };

  onMount(() => {
    ctx = canvas.getContext('2d')!;
    if (!ctx) {
      console.error('Canvas context not available');
      return;
    }
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  });

  redrawCanvas();
</script>

<canvas
  class="border-2 touch-none"
  width="300"
  height="500"
  bind:this={canvas}
  on:mousedown={startDrawing}
  on:mousemove={draw}
  on:mouseup={stopDrawing}
  on:mouseleave={stopDrawing}
  on:touchstart={startDrawing}
  on:touchmove={draw}
  on:touchend={stopDrawing}
  on:touchcancel={stopDrawing}
></canvas>
