/**
 * Fune Gallery – vanilla interactions. No external libraries.
 *
 *   1.  Loading intro (static → tuning → screen opens)
 *   2.  Grid cell height from the measured container width
 *   3.  Reveal on scroll + count-up + progress bars
 *   4.  Card reveal + channel-number roll
 *   5.  Random card glitch
 *   6.  Scroll-velocity VU meters
 *   7.  Hero ghost-text parallax
 *   8.  Hero cube: cursor tracking with inertia
 *   9.  Mobile menu / header search / sort auto-submit
 *   10. Lightbox
 *   11. CRT power-off page transition
 *
 * すべて prefers-reduced-motion で無効化する。
 */
(function () {
	'use strict';

	var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var COARSE = window.matchMedia('(hover: none)').matches;

	/* ---------------------------------------------------------
	 * 1. 読み込みイントロ
	 * ------------------------------------------------------- */
	function initIntro() {
		var intro = document.getElementById('fg-intro');
		if (!intro) { return; }

		// 動きを減らす設定では出さない
		if (REDUCE) { intro.remove(); return; }

		document.body.style.overflow = 'hidden';

		var ch = document.getElementById('fg-intro-ch');
		var msg = document.getElementById('fg-intro-msg');

		// チャンネルを探しているように数字を送る
		var seek = setInterval(function () {
			var n = Math.floor(Math.random() * 90) + 1;
			ch.textContent = 'CH.' + String(n).padStart(2, '0');
		}, 80);

		setTimeout(function () { msg.textContent = 'TUNING...'; }, 420);

		setTimeout(function () {
			clearInterval(seek);
			ch.textContent = 'CH.01';
			msg.textContent = 'ON AIR';
		}, 1050);

		setTimeout(function () {
			intro.classList.add('is-done');
			document.body.style.overflow = '';
		}, 1320);

		setTimeout(function () { intro.remove(); }, 1820);
	}

	/* ---------------------------------------------------------
	 * 2. グリッドの行の高さ
	 *
	 *    行は「列幅の 1/6」を単位にする。カードごとの行数は PHP が
	 *    画像の比から計算して入れてあるので、この単位が細かいほど
	 *    どの比の作品も無理なく収まる。
	 *    100vw だとスクロールバーぶんずれるので実測幅から出す。
	 * ------------------------------------------------------- */
	function initGrid() {
		function setCell() {
			document.querySelectorAll('.fg-grid').forEach(function (g) {
				var cs = getComputedStyle(g);
				var cols = parseInt(cs.getPropertyValue('--cols'), 10) || 5;
				var gap = parseFloat(cs.getPropertyValue('--gap')) || 14;
				var cell = (g.clientWidth - (cols - 1) * gap) / cols / 6;
				g.style.setProperty('--cell', cell.toFixed(2) + 'px');
			});
		}

		setCell();
		window.addEventListener('resize', setCell, { passive: true });
		window.addEventListener('load', setCell);
	}

	/* ---------------------------------------------------------
	 * 3. スクロールで現れる要素 / 数え上がり / 進捗バー
	 * ------------------------------------------------------- */
	function initReveal() {
		if (!('IntersectionObserver' in window)) {
			document.querySelectorAll('.fg-reveal').forEach(function (e) { e.classList.add('is-in'); });
			return;
		}

		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) { return; }
				entry.target.classList.add('is-in');

				entry.target.querySelectorAll('[data-bar]').forEach(function (b) {
					b.querySelector('i').style.width = b.dataset.bar + '%';
				});

				entry.target.querySelectorAll('[data-count]').forEach(function (el) {
					countUp(el);
				});

				io.unobserve(entry.target);
			});
		}, { rootMargin: '0px 0px -10% 0px' });

		document.querySelectorAll('.fg-reveal').forEach(function (e) { io.observe(e); });

		// .fg-reveal の外にある計器も動かす
		var loose = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) { return; }
				var i = entry.target.querySelector('i');
				if (i) { i.style.width = entry.target.dataset.bar + '%'; }
				loose.unobserve(entry.target);
			});
		}, { rootMargin: '0px 0px -10% 0px' });

		document.querySelectorAll('[data-bar]').forEach(function (b) {
			if (!b.closest('.fg-reveal')) { loose.observe(b); }
		});
	}

	function countUp(el) {
		var to = parseInt(el.dataset.count, 10) || 0;
		var out = el.querySelector('span') || el;

		if (REDUCE) { out.textContent = to; return; }

		var t0 = performance.now();
		var dur = 900;

		(function step(t) {
			var p = Math.min(1, (t - t0) / dur);
			out.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
			if (p < 1) { window.requestAnimationFrame(step); }
		})(t0);
	}

	/* ---------------------------------------------------------
	 * 4. カードの登場 + チャンネル番号のロール
	 *
	 *    どの方向から出すかは「グリッド内の列」で決める。
	 *    左端は左から、右端は右から、真ん中は下から。
	 *    大きいカードだけは奥から手前に出す。
	 *    animation は CSS の @keyframes なので var() が解決される。
	 * ------------------------------------------------------- */
	function initCards() {
		if (!('IntersectionObserver' in window)) {
			document.querySelectorAll('.fg-tv').forEach(function (e) { e.classList.add('is-in'); });
			return;
		}

		assignCardMotion();
		window.addEventListener('resize', assignCardMotion, { passive: true });

		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry, n) {
				if (!entry.isIntersecting) { return; }

				entry.target.style.setProperty('--in-delay', Math.min(n, 8) * 55 + 'ms');
				entry.target.classList.add('is-in');

				var ch = entry.target.querySelector('.fg-tv__ch');
				if (ch && !REDUCE) {
					var fin = ch.dataset.final || ch.textContent;
					ch.dataset.final = fin;
					setTimeout(function () { rollNumber(ch, fin, 420); }, Math.min(n, 8) * 55);
				}

				io.unobserve(entry.target);
			});
		}, { rootMargin: '0px 0px -6% 0px' });

		document.querySelectorAll('.fg-tv').forEach(function (e) { io.observe(e); });
	}

	// 列の位置から、登場方向と横流れの量を決める
	function assignCardMotion() {
		document.querySelectorAll('.fg-grid').forEach(function (grid) {
			var cols = parseInt(getComputedStyle(grid).getPropertyValue('--cols'), 10) || 5;
			var gridLeft = grid.getBoundingClientRect().left;
			var colW = grid.clientWidth / cols;

			grid.querySelectorAll('.fg-tv').forEach(function (card) {
				var col = Math.round((card.getBoundingClientRect().left - gridLeft) / colW);
				var mid = (cols - 1) / 2;
				var side = col - mid;                       // 中央からの距離（符号つき）
				var edge = mid > 0 ? side / mid : 0;        // -1 〜 1

				// 横流れ。外側の列ほど大きく動くので、全体が斜めに流れて見える
				card.style.setProperty('--pmul', edge.toFixed(3));

				if (card.classList.contains('fg-tv--feature')) {
					// 見せ札は奥から手前へ
					card.style.setProperty('--in-x', '0px');
					card.style.setProperty('--in-y', '54px');
					card.style.setProperty('--in-sc', '.88');
				} else if (card.getBoundingClientRect().height > colW * 1.2) {
					// 縦に長いカードは下から立ち上がる
					card.style.setProperty('--in-x', '0px');
					card.style.setProperty('--in-y', '76px');
					card.style.setProperty('--in-sc', '.94');
				} else if (edge < -0.4) {
					card.style.setProperty('--in-x', '-86px');
					card.style.setProperty('--in-y', '30px');
					card.style.setProperty('--in-rot', 'calc(var(--rot, 0deg) - 5deg)');
				} else if (edge > 0.4) {
					card.style.setProperty('--in-x', '86px');
					card.style.setProperty('--in-y', '30px');
					card.style.setProperty('--in-rot', 'calc(var(--rot, 0deg) + 5deg)');
				} else {
					card.style.setProperty('--in-x', '0px');
					card.style.setProperty('--in-y', '58px');
				}
			});
		});
	}

	// 確定するまでスロットのように回す。左の桁から順に固定される。
	function rollNumber(el, finalText, ms) {
		if (REDUCE) { el.textContent = finalText; return; }

		var digits = finalText.replace(/\D/g, '');
		if (!digits) { return; }

		var prefix = finalText.slice(0, finalText.length - digits.length);
		var t0 = performance.now();
		el.classList.add('is-rolling');

		(function step(t) {
			var p = (t - t0) / ms;
			if (p >= 1) {
				el.textContent = finalText;
				el.classList.remove('is-rolling');
				return;
			}
			var s = '';
			for (var i = 0; i < digits.length; i++) {
				var lock = (i + 1) / digits.length * 0.85;
				s += p > lock ? digits[i] : Math.floor(Math.random() * 10);
			}
			el.textContent = prefix + s;
			window.requestAnimationFrame(step);
		})(t0);
	}

	/* ---------------------------------------------------------
	 * 5. 数秒に一度、画面内のカードを1枚だけ一瞬グリッチさせる
	 * ------------------------------------------------------- */
	function initGlitch() {
		if (REDUCE) { return; }

		function visible() {
			return Array.prototype.filter.call(document.querySelectorAll('.fg-tv'), function (el) {
				var r = el.getBoundingClientRect();
				return r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
			});
		}

		(function tick() {
			// 規則的だと機械っぽくなるので待ち時間は毎回変える
			var wait = 2600 + Math.random() * 3800;

			setTimeout(function () {
				var cards = visible();
				if (cards.length && !document.hidden) {
					var el = cards[Math.floor(Math.random() * cards.length)];
					el.classList.add('is-glitch');
					setTimeout(function () { el.classList.remove('is-glitch'); }, 260);
				}
				tick();
			}, wait);
		})();
	}

	/* ---------------------------------------------------------
	 * 6. スクロール速度でレベルメーターが振り切れる
	 * ------------------------------------------------------- */
	function initVu() {
		if (REDUCE) { return; }

		var last = window.scrollY;
		var v = 0;
		var peak = false;

		window.addEventListener('scroll', function () {
			v = Math.min(1, Math.abs(window.scrollY - last) / 58);
			last = window.scrollY;
		}, { passive: true });

		(function loop() {
			v *= 0.9; // 減衰
			document.documentElement.style.setProperty('--vu', v.toFixed(3));

			var now = v > 0.55;
			if (now !== peak) {
				peak = now;
				document.querySelectorAll('.fg-meter--live').forEach(function (m) {
					m.classList.toggle('is-peak', peak);
				});
			}

			window.requestAnimationFrame(loop);
		})();
	}

	/* ---------------------------------------------------------
	 * 6a. 右端の縦ナビを「起動」させる
	 *
	 *     イントロが終わったタイミングで、右の外から滑り込み →
	 *     中央の線から開く → 数字がスロットのように確定、の順で点く。
	 *     以降はスクロール量をゲージに出す。
	 * ------------------------------------------------------- */
	function initSideNav() {
		var nav = document.getElementById('fg-sidenav');
		if (!nav) { return; }

		// イントロを出す場合はその後に、出さない場合はすぐ起動する
		var wait = (REDUCE || !document.getElementById('fg-intro')) ? 120 : 1500;

		setTimeout(function () {
			nav.classList.add('is-on');

			if (!REDUCE) {
				nav.querySelectorAll('[data-fg-roll]').forEach(function (el, i) {
					var fin = el.textContent;
					setTimeout(function () { rollNumber(el, fin, 460); }, 420 + i * 110);
				});
			}
		}, wait);

		// スクロール量のゲージ
		var fill = nav.querySelector('.fg-sidenav__prog i');
		if (!fill) { return; }

		function update() {
			var max = document.documentElement.scrollHeight - window.innerHeight;
			var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
			fill.style.setProperty('--p', (p * 100).toFixed(1) + '%');
		}

		update();
		window.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', update, { passive: true });
	}

	/* ---------------------------------------------------------
	 * 6b. スクロール連動の視差
	 *
	 *     - [data-fg-parallax] の装飾を、係数ぶんだけ縦にずらす
	 *     - グリッドは列ごとに横流れさせて、全体が斜めに動いて見せる
	 *     - マスコットはギャラリーを見ているあいだ右端に併走する
	 * ------------------------------------------------------- */
	function initParallax() {
		if (REDUCE) { return; }

		var items = Array.prototype.map.call(
			document.querySelectorAll('[data-fg-parallax]'),
			function (el) {
				return {
					el: el,
					speed: parseFloat(el.dataset.fgParallax) || 0,
					rot: parseFloat(el.dataset.fgRot) || 0
				};
			}
		);

		var grids = Array.prototype.slice.call(document.querySelectorAll('.fg-grid'));
		var rider = document.getElementById('fg-rider');
		var gallery = document.getElementById('fg-gallery');

		var vh = window.innerHeight;
		window.addEventListener('resize', function () { vh = window.innerHeight; }, { passive: true });

		(function loop() {
			// 画面中央から見た位置を -1 〜 1 に正規化して使う
			items.forEach(function (it) {
				var r = it.el.getBoundingClientRect();
				if (r.bottom < -200 || r.top > vh + 200) { return; }
				var p = ((r.top + r.height / 2) - vh / 2) / vh;
				it.el.style.setProperty('--sy', (p * it.speed * vh).toFixed(1) + 'px');
				if (it.rot) { it.el.style.setProperty('--srot', (p * it.rot).toFixed(2) + 'deg'); }
			});

			grids.forEach(function (g) {
				var r = g.getBoundingClientRect();
				if (r.bottom < -400 || r.top > vh + 400) { return; }
				var p = ((r.top + r.height / 2) - vh / 2) / Math.max(vh, r.height);
				// 外側の列ほど大きく流れる（--pmul はカードごとに入れてある）
				g.style.setProperty('--drift', (p * 38).toFixed(1) + 'px');
			});

			if (rider && gallery) {
				var gr = gallery.getBoundingClientRect();
				var inside = gr.top < vh * 0.5 && gr.bottom > vh * 0.4;
				rider.classList.toggle('is-in', inside);
				if (inside) {
					var t = window.scrollY / 90;
					rider.style.setProperty('--ry', (Math.sin(t) * 10).toFixed(1) + 'px');
					rider.style.setProperty('--rrot', (Math.sin(t * 0.7) * 9).toFixed(1) + 'deg');
				}
			}

			window.requestAnimationFrame(loop);
		})();
	}

	/* ---------------------------------------------------------
	 * 7. ヒーローの巨大ゴースト文字をカーソルに追従させる
	 * ------------------------------------------------------- */
	function initGhost() {
		var ghost = document.querySelector('.fg-hero__ghost');
		var hero = document.querySelector('.fg-hero');
		if (!ghost || !hero || REDUCE || COARSE) { return; }

		var x = 0, y = 0, tx = 0, ty = 0;

		window.addEventListener('mousemove', function (e) {
			var r = hero.getBoundingClientRect();
			if (e.clientY < r.top || e.clientY > r.bottom) { return; }
			tx = ((e.clientX / window.innerWidth) - 0.5) * -40;
			ty = ((e.clientY - r.top) / r.height - 0.5) * -16;
		}, { passive: true });

		(function loop() {
			x += (tx - x) * 0.05;
			y += (ty - y) * 0.05;
			ghost.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
			window.requestAnimationFrame(loop);
		})();
	}

	/* ---------------------------------------------------------
	 * 8. ヒーローの CSS 3D キューブ
	 *    カーソルはヒーロー全体で拾い、離れたら自動回転に戻る。
	 *    lerp で補間しているぶんが「慣性」になる。
	 *
	 *    タッチ端末はカーソルが無いので、代わりにスワイプで回す。
	 *    こちらは指を離すまで回し、離したら惰性で減衰して止まる。
	 * ------------------------------------------------------- */
	function initCube() {
		var stage = document.getElementById('fg-stage');
		var cube = document.getElementById('fg-cube');
		if (!stage || !cube) { return; }

		if (REDUCE) { return; }

		// タッチ端末はカーソルが無い。スワイプで回せるようにし、
		// 操作の案内も「SWIPE」に差し替える。
		if (COARSE) {
			var hint = stage.querySelector('.fg-stage__hint');
			if (hint) { hint.textContent = 'SWIPE'; }
			initCubeSwipe(stage, cube);
			return;
		}

		var hero = stage.closest('.fg-hero');
		if (!hero) { return; }

		var tx = 24, ty = -16, cx = 24, cy = -16;
		var idle = 0;
		var active = false;

		window.addEventListener('mousemove', function (e) {
			var h = hero.getBoundingClientRect();
			if (e.clientY < h.top || e.clientY > h.bottom) { active = false; return; }

			var r = stage.getBoundingClientRect();
			active = true;
			tx = ((e.clientX - (r.left + r.width / 2)) / h.width) * 150;
			ty = -((e.clientY - (r.top + r.height / 2)) / h.height) * 90;
		}, { passive: true });

		(function loop() {
			if (!active) {
				idle += 0.28;
				tx = 24 + Math.sin(idle / 60) * 34;
				ty = -16 + Math.cos(idle / 85) * 12;
			}
			cx += (tx - cx) * 0.075;
			cy += (ty - cy) * 0.075;
			cube.style.transform = 'rotateX(' + cy.toFixed(2) + 'deg) rotateY(' + cx.toFixed(2) + 'deg)';
			window.requestAnimationFrame(loop);
		})();
	}

	/**
	 * タッチ端末向け。横スワイプで立方体を回す。
	 *
	 * touch-action:pan-y を JS 側で立てているのがポイント。
	 * これで「横方向はこちらが受け取る／縦方向はページのスクロールに渡す」を
	 * ブラウザに任せられる。preventDefault で止める作りにすると、
	 * 立方体の上に指を置いたときにページが動かせなくなる。
	 *
	 * 回すのは横方向の移動量だけにしてある。縦はスクロールに渡している以上、
	 * その移動量で回すとスクロール中に立方体が暴れるため。
	 */
	function initCubeSwipe(stage, cube) {
		// 既定の姿勢はマウス版の初期値に合わせる
		var rx = -16, ry = 24;
		var vy = 0;              // 指を離したあとの惰性
		var lastX = 0;
		var dragging = false;
		var raf = null;

		stage.style.touchAction = 'pan-y';
		stage.style.cursor = 'grab';

		function render() {
			cube.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
		}

		// 動きが収まったら rAF を畳む。指を触れていないあいだ回し続けない。
		function spin() {
			if (!dragging) {
				ry += vy;
				vy *= 0.94;
				render();
				if (Math.abs(vy) < 0.02) { raf = null; return; }
			}
			raf = window.requestAnimationFrame(spin);
		}

		function kick() {
			if (raf === null) { raf = window.requestAnimationFrame(spin); }
		}

		stage.addEventListener('touchstart', function (e) {
			dragging = true;
			vy = 0;
			lastX = e.touches[0].clientX;
			kick();
		}, { passive: true });

		stage.addEventListener('touchmove', function (e) {
			if (!dragging) { return; }
			var x = e.touches[0].clientX;
			var dx = x - lastX;
			lastX = x;
			ry += dx * 0.6;
			vy = dx * 0.6;   // 離したあとはこの勢いを引き継ぐ
			render();
		}, { passive: true });

		function end() {
			if (!dragging) { return; }
			dragging = false;
			kick();
		}
		stage.addEventListener('touchend', end, { passive: true });
		stage.addEventListener('touchcancel', end, { passive: true });

		render();
	}

	/* ---------------------------------------------------------
	 * 9. モバイルメニュー / ヘッダー検索 / 並び替えの自動送信
	 * ------------------------------------------------------- */
	function initNav() {
		var burger = document.querySelector('.fg-burger');
		var menu = document.getElementById('fg-menu');

		if (burger && menu) {
			burger.addEventListener('click', function () {
				var open = menu.classList.toggle('is-open');
				burger.classList.toggle('is-active', open);
				burger.setAttribute('aria-expanded', open ? 'true' : 'false');
				document.body.style.overflow = open ? 'hidden' : '';
			});

			document.addEventListener('keydown', function (e) {
				if (e.key === 'Escape' && menu.classList.contains('is-open')) {
					burger.click();
					burger.focus();
				}
			});
		}

		var button = document.querySelector('.fg-header__icon');
		var bar = document.getElementById('fg-searchbar');

		if (button && bar) {
			button.addEventListener('click', function () {
				var open = bar.classList.toggle('is-open');
				button.setAttribute('aria-expanded', open ? 'true' : 'false');
				if (open) {
					var input = bar.querySelector('input');
					if (input) { input.focus(); }
				}
			});

			document.addEventListener('keydown', function (e) {
				if (e.key === 'Escape' && bar.classList.contains('is-open')) {
					bar.classList.remove('is-open');
					button.setAttribute('aria-expanded', 'false');
					button.focus();
				}
			});
		}

		// フォームは JS 無しでも送信できるので、これは上乗せ
		document.querySelectorAll('[data-fg-autosubmit]').forEach(function (el) {
			el.addEventListener('change', function () {
				if (el.form) { el.form.submit(); }
			});
		});
	}

	/* ---------------------------------------------------------
	 * 10. ライトボックス
	 * ------------------------------------------------------- */
	function initLightbox() {
		var box = document.getElementById('fg-lightbox');
		var image = document.getElementById('fg-lightbox-img');
		var close = document.getElementById('fg-lightbox-close');
		if (!box || !image || !close) { return; }

		var opener = null;

		function open(src, alt, from) {
			image.src = src;
			image.alt = alt || '';
			box.classList.add('is-open');
			opener = from;
			document.body.style.overflow = 'hidden';
			close.focus();
		}

		function hide() {
			box.classList.remove('is-open');
			document.body.style.overflow = '';
			if (opener && typeof opener.focus === 'function') { opener.focus(); }
		}

		document.addEventListener('click', function (e) {
			var trigger = e.target.closest('[data-fg-lightbox]');
			if (!trigger) { return; }
			e.preventDefault();
			var inner = trigger.querySelector('img');
			open(trigger.getAttribute('data-fg-lightbox'), inner ? inner.alt : '', trigger);
		});

		close.addEventListener('click', hide);
		box.addEventListener('click', function (e) { if (e.target === box) { hide(); } });

		document.addEventListener('keydown', function (e) {
			if (!box.classList.contains('is-open')) { return; }
			if (e.key === 'Escape') {
				hide();
			} else if (e.key === 'Tab') {
				// 閉じるボタン以外に飛べる要素がないので、そこに閉じ込める
				e.preventDefault();
				close.focus();
			}
		});

		// 図版はボタンではないので、キーボードでも開けるようにする
		document.querySelectorAll('[data-fg-lightbox]').forEach(function (el) {
			el.setAttribute('tabindex', '0');
			el.setAttribute('role', 'button');
			el.addEventListener('keydown', function (e) {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					el.click();
				}
			});
		});
	}

	/* ---------------------------------------------------------
	 * 11. ページ送りに「テレビの電源が切れる」演出を挟む
	 * ------------------------------------------------------- */
	function initCrt() {
		var crt = document.getElementById('fg-crt');
		if (!crt || REDUCE) { return; }

		document.addEventListener('click', function (e) {
			var link = e.target.closest('.fg-pager a');
			if (!link || !link.href) { return; }

			e.preventDefault();

			var flash = crt.querySelector('.fg-crt__flash');
			crt.classList.add('is-on');
			flash.style.animation = 'none';
			void flash.offsetWidth;   // アニメーションを巻き戻す
			flash.style.animation = '';

			setTimeout(function () { window.location.href = link.href; }, 380);
		});
	}

	function boot() {
		initIntro();
		initGrid();
		initReveal();
		initCards();
		initGlitch();
		initVu();
		initSideNav();
		initParallax();
		initGhost();
		initCube();
		initNav();
		initLightbox();
		initCrt();
	}

	// WordPress 版は wp_footer() から読まれるので DOMContentLoaded を待てばよかった。
	// Next.js では next/script が読み込むタイミング次第で、その時点で既に
	// 解析が終わっていることがある。その場合は待たずに走らせる。
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}
})();
