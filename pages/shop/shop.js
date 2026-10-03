import { playerState, GameHeader } from '../../share/main.js';
import { initStage } from '../../share/stage.js';
import { SHOPS } from '../../component/shopPanel/shopConfig.js';
import { ShopPanel } from '../../component/shopPanel/shopPanel.js';
import { Mood } from '../../component/mood/mood.js';
import { can } from '../../share/roles.js';

initStage();
GameHeader.render(playerState);

// ?shop=home — id cửa hàng không có trong SHOPS thì quay lại bản đồ
const shopId = new URLSearchParams(window.location.search).get('shop');
if (!SHOPS[shopId] || (localStorage.getItem('isLoggedIn') === 'true' && !can('move'))) {
    window.location.replace('../outSide/outSide.html');
} else {
    ShopPanel.render('shop-slot', shopId);
    Mood.start('outside'); // đang ở ngoài phòng nên tinh thần vẫn giảm
}
