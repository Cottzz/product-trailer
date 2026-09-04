/* SellerScope example · terminal PTContent configuration.
 * Loaded BEFORE content/terminal/content.js (see pt_build.py --content order).
 * Reproduces the original SellerScope reference cut deterministically.
 */
window.PT_TERMINAL_CFG = {
  brand: 'SellerScope',
  tagline: 'One command. The whole market.',
  version: 'v2.2',
  host: 'visitor@scope',
  path: '~',
  statusLeft: '[scope] 0:scan* 1:track 2:report │ US-HOME',
  statusRight: 'uptime {t} │ 09:41',
  endLeft: '[scope] session complete · exit [0]',
  whoosh: 23,
  logo: [
    '  ___   ___   ___  ___  ___',
    ' / __| / __| / _ \\| _ \\| __|',
    ' \\__ \\| (__ | (_) |   /| _|',
    ' |___/ \\___| \\___/|_|_\\|___|'
  ],
  events: [
    { t: 0.5, type: 'line', html: '<span class="s">Last login: Fri Sep  4 09:41:02 on ttys001</span>' },
    { t: 0.9, type: 'type', d: 1.5, prompt: true, text: './sellerscope --boot', sound: 'tick' },
    { t: 2.6, type: 'line', html: '[ <span class="g">OK</span> ] market-matrix engine ......... <span class="g">loaded</span>', sound: 'ok' },
    { t: 3.1, type: 'line', html: '[ <span class="g">OK</span> ] asin tracker ................. <span class="g">online</span>', sound: 'ok' },
    { t: 3.6, type: 'line', html: '[ <span class="g">OK</span> ] report generator v2.2 ........ <span class="g">ready</span>', sound: 'ok' },
    { t: 4.3, type: 'line', html: '' },
    { t: 4.5, type: 'line', html: '<span class="g">  ___   ___   ___  ___  ___</span>', sound: 'tick' },
    { t: 4.72, type: 'line', html: '<span class="g"> / __| / __| / _ \\| _ \\| __|</span>', sound: 'tick' },
    { t: 4.94, type: 'line', html: '<span class="g"> \\__ \\| (__ | (_) |   /| _|</span>', sound: 'tick' },
    { t: 5.16, type: 'line', html: '<span class="g"> |___/ \\___| \\___/|_|_\\|___|</span>', sound: 'tick' },
    { t: 5.7, type: 'line', html: '<span class="c">SellerScope</span> <span class="s">· Amazon Market Intelligence v2.2</span>' },
    { t: 6.1, type: 'line', html: '<span class="s">type \'scope help\' to begin</span>' },
    { t: 6.6, type: 'line', html: '' },
    { t: 6.9, type: 'type', d: 1.4, prompt: true, text: 'scope scan --market US --category home', sound: 'tick' },
    { t: 8.5, type: 'line', html: '<span class="s"># scanning 3,287 ASINs across 12 niches ...</span>' },
    { t: 8.8, type: 'prog', d: 1.3, f: function (p) {
        var n = 20, f = Math.round(p * n);
        return '  <span class="a">[' + '█'.repeat(f) + '░'.repeat(n - f) + '] ' +
          String(Math.round(p * 100)).padStart(3, ' ') + '%</span>  <span class="s">scanning</span>';
      } },
    { t: 10.2, type: 'line', html: '<span class="s">total 3287</span>' },
    { t: 10.5, type: 'line', html: '<span class="s">drwxr-xr-x</span>  <span class="m">red_ocean</span>    412   <span class="a">$28.4M</span>   barrier: <span class="m">HIGH</span>', sound: 'tick' },
    { t: 10.8, type: 'line', html: '<span class="s">drwxr-xr-x</span>  <span class="m">red_ocean</span>    387   <span class="a">$22.1M</span>   barrier: <span class="m">HIGH</span>', sound: 'tick' },
    { t: 11.1, type: 'line', html: '<span class="s">drwxr-xr-x</span>  <span class="g">blue_ocean</span>   126   <span class="a">$9.8M</span>    barrier: <span class="g">LOW</span>   <span class="c">← opportunity</span>', sound: 'tick' },
    { t: 11.4, type: 'line', html: '<span class="s">drwxr-xr-x</span>  <span class="g">blue_ocean</span>    94   <span class="a">$6.3M</span>    barrier: <span class="g">LOW</span>   <span class="c">← opportunity</span>', sound: 'tick' },
    { t: 11.7, type: 'line', html: '<span class="s">drwxr-xr-x</span>  <span class="m">red_ocean</span>    356   <span class="a">$19.7M</span>   barrier: <span class="m">HIGH</span>', sound: 'tick' },
    { t: 12.2, type: 'line', html: '' },
    { t: 12.4, type: 'line', html: '<span class="s">niche ranking (top 4):</span>' },
    { t: 12.7, type: 'line', html: 'kitchen-organizer  [<span class="g">████████████████</span><span class="s">░░░░</span>]  <span class="a">82%</span>', sound: 'tick' },
    { t: 13.0, type: 'line', html: 'wall-shelves       [<span class="g">███████████</span><span class="s">░░░░░░░░░</span>]  <span class="a">57%</span>', sound: 'tick' },
    { t: 13.3, type: 'line', html: 'desk-accessories   [<span class="g">████████</span><span class="s">░░░░░░░░░░░░</span>]  <span class="a">41%</span>', sound: 'tick' },
    { t: 13.6, type: 'line', html: 'pet-supplies       [<span class="g">██████</span><span class="s">░░░░░░░░░░░░░░</span>]  <span class="a">33%</span>', sound: 'tick' },
    { t: 14.0, type: 'line', html: '' },
    { t: 14.2, type: 'line', html: '<span class="g">3,287 ASINs scanned</span> · <span class="a">12 niches found</span> · <span class="g">2 blue oceans</span>' },
    { t: 14.6, type: 'line', html: '<span class="g">[0] OK</span>  <span class="s">(0.84s)</span>', sound: 'ok' },
    { t: 15.2, type: 'line', html: '' },
    { t: 15.5, type: 'type', d: 1.5, prompt: true, text: 'scope track --asin B08KX7T4P2 --watch', sound: 'tick' },
    { t: 17.2, type: 'line', html: '<span class="s"># watching 47 competitors in realtime ...</span>' },
    { t: 17.5, type: 'line', html: '  <span class="s">PID</span>    <span class="c">ASIN</span>         <span class="s">PRICE</span>    <span class="s">SALES/MO</span>   <span class="s">RATING</span>   <span class="s">TREND</span>' },
    { t: 17.9, type: 'line', html: ' <span class="s">1024</span>   <span class="c">B08KX7T4P2</span>   <span class="a">$29.99</span>    <span class="a">4,210</span>      <span class="a">4.6</span>     <span class="g">↑ 12.4%</span>', sound: 'tick' },
    { t: 18.3, type: 'line', html: ' <span class="s">1025</span>   <span class="c">B09LM2R8Q6</span>   <span class="a">$31.50</span>    <span class="a">3,877</span>      <span class="a">4.5</span>     <span class="g">↑  8.1%</span>', sound: 'tick' },
    { t: 18.7, type: 'line', html: ' <span class="s">1026</span>   <span class="c">B07VX9N3W1</span>   <span class="a">$24.99</span>    <span class="a">5,102</span>      <span class="a">4.3</span>     <span class="m">↓  2.2%</span>', sound: 'tick' },
    { t: 19.1, type: 'line', html: ' <span class="s">1027</span>   <span class="c">B0CZ1Q8R5M</span>   <span class="a">$27.90</span>    <span class="a">2,964</span>      <span class="a">4.7</span>     <span class="g">↑ 15.6%</span>', sound: 'tick' },
    { t: 19.7, type: 'line', html: '<span class="m">WARN</span>  competitor B09LM2R8Q6 price drop <span class="m">-7.4%</span>', sound: 'warn' },
    { t: 20.2, type: 'line', html: '<span class="g">47 competitors tracked</span> · <span class="a">3 price alerts</span> · <span class="a">1,860 reviews parsed</span>' },
    { t: 20.6, type: 'line', html: '<span class="g">[0] OK</span>  <span class="s">(0.62s)</span>', sound: 'ok' },
    { t: 21.1, type: 'line', html: '' },
    { t: 21.4, type: 'type', d: 1.3, prompt: true, text: 'scope report --full --v2.2', sound: 'tick' },
    { t: 22.9, type: 'line', html: '<span class="s"># compiling full market report ...</span>' },
    { t: 23.2, type: 'prog', d: 2.6,
      labelAt: function (p) { return p < .34 ? 'collecting ASIN data' : p < .58 ? 'analyzing keyword traffic' : p < .81 ? 'building niche matrix' : p < 1 ? 'rendering charts' : 'done'; },
      f: function (p, l) {
        var n = 20, f = Math.round(p * n);
        return '  <span class="a">[' + '█'.repeat(f) + '░'.repeat(n - f) + '] ' +
          String(Math.round(p * 100)).padStart(3, ' ') + '%</span>  <span class="s">' + l + '</span>';
      } },
    { t: 26.0, type: 'line', html: '' },
    { t: 26.2, type: 'line', html: '<span class="s">exported:</span>' },
    { t: 26.5, type: 'line', html: '<span class="s">-rw-r--r--</span>  1 scope  staff   <span class="a">2.4M</span>   <span class="c">market_matrix_v2.2.pdf</span>', sound: 'tick' },
    { t: 26.8, type: 'line', html: '<span class="s">-rw-r--r--</span>  1 scope  staff   <span class="a">1.8M</span>   <span class="c">competitor_asin_watch.pdf</span>', sound: 'tick' },
    { t: 27.1, type: 'line', html: '<span class="s">-rw-r--r--</span>  1 scope  staff   <span class="a">3.1M</span>   <span class="c">us_home_report.pdf</span>', sound: 'tick' },
    { t: 27.5, type: 'line', html: '<span class="g">3 reports</span> · <span class="a">86 pages</span> · ready in <span class="a">4.2s</span>' },
    { t: 27.9, type: 'line', html: '<span class="g">[0] OK</span>', sound: 'ok' }
  ]
};
