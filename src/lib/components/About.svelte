<script>
  import { Modal } from "flowbite-svelte";
  export let aboutModal = false;
</script>

<Modal title="About DrawAt!" bind:open={aboutModal} autoclose outsideclose>
  <div class="space-y-2">
    <p><b>DrawAt</b>は、AT Protocolを利用したお絵描きチャットです。</p>
    <p>お絵描きにあたってはBlueskyのアカウントによる認証が必要です。</p>
    <p><a href="https://bsky.app/profile/suibari.com" target="_blank">すいばり</a> が開発を行いました。</p>
  </div>
  <div class="mt-2 space-y-2">
    <h1 class="text-2xl font-semibold mb-2">使い方</h1>
    <p>ページ表示時、ページ中央のキャンバスにDrawAtユーザの描いたお絵描きが表示されます。</p>
    <p>未ログイン時、お絵描きはできず表示のみです。ログインすると、お絵描きが可能になります。</p>
    <p><b>"Post & Load!"</b>ボタンを押すことで、現在描いたお絵描きをサーバに一時保存し、かつサーバからDrawAtユーザのお絵描きを読み込みます。</p>
    <p><b>"Delte my drawing</b>"ボタンを押すことで、自分が保存したお絵描き情報をサーバから削除します。</p>
    <p>お絵描きを保存せず最初からやり直したい場合、ページリロードしてください。</p>
    <p>ペンの色はページリロード時にランダムに選択されます。</p>
  </div>
  <div class="mt-2 space-y-2">
    <h1 class="text-2xl font-semibold mb-2">免責事項</h1>
    <p>本サービスを利用したことによる過失や損害につきまして、開発者は一切の責任を負いません。ご了承ください。</p>
    <p>本サービスは法令及びガイドラインに別段の定めがある場合を除き、同意を得ないで第三者に情報を提供することはいたしません。</p>
    <p>本サービスは個人情報に対して適用される日本の法令を遵守するとともに、本ポリシーの内容を適宜見直しその改善に努めます。</p>
  </div>
	<div class="mt-2 space-y-2">
    <h1 class="text-2xl font-semibold mb-2">ライセンス</h1>
		<p>本サービスはOSSであり、ソースコードは<a href="https://github.com/suibari/drawat" target="_blank">GitHub</a> で自由にご覧いただけます。</p>
	</div>
</Modal>
