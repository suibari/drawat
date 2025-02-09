<script lang="ts">
  import { onMount } from 'svelte';

  export let drawingData: App.Path[] = [];
  export let readonly: boolean = false;
  export let userDid: string | null = null;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let drawing = false;
  let lastX = 0;
  let lastY = 0;
  let currentColor = 'black';
  let currentSize = 5;

  /**
   * リロードのたびにランダムカラー設定
   */
  function generateRandomDarkColor(): string {
    const hue = Math.floor(Math.random() * 360); // 0〜360° (全色)
    const saturation = Math.floor(Math.random() * 31) + 70; // 70〜100% (鮮やか)
    const lightness = Math.floor(Math.random() * 31) + 20; // 20〜50% (ある程度濃い色)

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  onMount(() => {
    currentColor = generateRandomDarkColor();
  });

  /**
   * ストローク時にCanvasに描画
   */
  const startDrawing = (e: MouseEvent | TouchEvent) => {
    if (!userDid) return;
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

    drawingData.push({ x: offsetX, y: offsetY, color: currentColor, size: currentSize, isNewStroke: true, author: userDid });
  };

  const stopDrawing = () => {
    drawing = false;
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!drawing || readonly || !userDid) return;
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

    drawingData.push({ x: offsetX, y: offsetY, color: currentColor, size: currentSize, isNewStroke: false, author: userDid });

    lastX = offsetX;
    lastY = offsetY;
  };

  /**
   * drawingDataの描画実行
   */
  $: if (drawingData) {
    redrawCanvas();
  }

  const redrawCanvas = () => {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
