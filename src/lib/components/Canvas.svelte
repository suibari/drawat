<script lang="ts">
  export let drawingData: { x: number, y: number, color: string, size: number }[] = [];
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let drawing = false;
  let lastX = 0;
  let lastY = 0;
  let currentColor = 'black';
  let currentSize = 5;

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    drawing = true;
    if (e instanceof MouseEvent) {
      const { offsetX, offsetY } = e;
      lastX = offsetX;
      lastY = offsetY;
    } else if (e instanceof TouchEvent) {
      const { clientX, clientY } = e.touches[0];
      lastX = clientX - canvas.offsetLeft;
      lastY = clientY - canvas.offsetTop;
    }
  };

  const stopDrawing = () => {
    drawing = false;
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!drawing) return;
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

    drawingData.push({ x: offsetX, y: offsetY, color: currentColor, size: currentSize });

    lastX = offsetX;
    lastY = offsetY;
  };

  import { onMount } from 'svelte';

  onMount(() => {
    ctx = canvas.getContext('2d')!;
    if (!ctx) {
      console.error('Canvas context not available');
      return;
    }
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  });
</script>

<canvas
  class="border-2 touch-none"
  width="300"
  height="600"
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
