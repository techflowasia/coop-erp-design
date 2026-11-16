// ════════════════════════════════════════════════════════════════════
//  ตัวสร้างบาร์โค้ด Code 128 (subset B) — คืนค่าเป็น SVG string
//  ใช้กับสติกเกอร์ครุภัณฑ์ (รหัสครุภัณฑ์) — ไม่พึ่ง library ภายนอก
// ════════════════════════════════════════════════════════════════════
(function () {
  // ตารางลวดลาย Code128 (index 0..106) — ความกว้างแท่ง/ช่องว่างสลับกัน
  var P = [
    "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
    "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
    "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
    "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
    "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
    "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
    "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
    "112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
    "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
    "214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
    "114131","311141","411131","211412","211214","211232","2331112",
  ];

  // สร้าง SVG บาร์โค้ดจากข้อความ (ASCII 32–126)
  window.barcode128 = function (text, opts) {
    opts = opts || {};
    var mod = opts.module || 2;          // ความกว้างต่อ 1 module (px)
    var height = opts.height || 56;      // ความสูงแท่ง (px)
    var quiet = opts.quiet != null ? opts.quiet : 10; // ขอบเงียบ (modules)
    text = String(text == null ? '' : text);

    var codes = [104];   // Start B
    var sum = 104;
    for (var i = 0; i < text.length; i++) {
      var val = text.charCodeAt(i) - 32;
      if (val < 0 || val > 94) val = 0;  // อักขระนอกช่วง → space
      codes.push(val);
      sum += val * (i + 1);
    }
    codes.push(sum % 103); // checksum
    codes.push(106);       // Stop

    var modules = '';
    for (var c = 0; c < codes.length; c++) modules += P[codes[c]];

    var totalMods = 0;
    for (var k = 0; k < modules.length; k++) totalMods += parseInt(modules[k], 10);

    var w = (totalMods + quiet * 2) * mod;
    var rects = '';
    var x = quiet * mod;
    var black = true;
    for (var m = 0; m < modules.length; m++) {
      var bw = parseInt(modules[m], 10) * mod;
      if (black) rects += '<rect x="' + x + '" y="0" width="' + bw + '" height="' + height + '" fill="#000"/>';
      x += bw;
      black = !black;
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + height +
      '" viewBox="0 0 ' + w + ' ' + height + '" preserveAspectRatio="none" shape-rendering="crispEdges" ' +
      'role="img" aria-label="barcode ' + text + '"><rect width="' + w + '" height="' + height +
      '" fill="#fff"/>' + rects + '</svg>';
  };
})();
