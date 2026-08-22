/**
 * front-page.php のヒーロー部分。
 * ゴースト文字 / 飛沫 / 黒リボン+ネオン+ペンキ垂れ / スケボー / 3DキューブTV。
 */
import type { CSSProperties } from "react";
import type { Illustration } from "@/lib/types";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { SIZES_CUBE, WorkImage } from "./WorkImage";

const FACES = ["front", "back", "right", "left", "top", "bottom"] as const;

export default function Hero({ cube }: { cube: Illustration[] }) {
  return (
    <section className="fg-hero">
      <div className="fg-hero__ghost" aria-hidden="true">
        FUNE6900
      </div>

      {/* スプレーの飛沫（見出しの裏）。視差の量を変えて奥行きを出す */}
      <svg
        className="fg-spatter fg-para"
        data-fg-parallax="0.16"
        style={{
          left: "2%",
          top: "14%",
          width: 280,
          height: 280,
          color: "var(--lime)",
          opacity: 0.55,
        }}
        aria-hidden="true"
      >
        <use href="#fg-i-spatter" />
      </svg>
      <svg
        className="fg-spatter fg-para"
        data-fg-parallax="-0.1"
        style={{
          right: "26%",
          top: "6%",
          width: 170,
          height: 170,
          color: "var(--neon-pink)",
          opacity: 0.22,
        }}
        aria-hidden="true"
      >
        <use href="#fg-i-spatter" />
      </svg>

      <div
        className="fg-hero__ribbon fg-para"
        data-fg-parallax="0.06"
        data-fg-rot="1.6"
        style={{ ["--base-rot"]: "-4.5deg" } as CSSProperties}
        aria-hidden="true"
      >
        <div className="fg-drip" style={{ color: "var(--ink)" }}>
          <svg>
            <use href="#fg-i-drip" />
          </svg>
        </div>
        <div
          className="fg-neon-tube"
          style={{ position: "absolute", left: "24%", right: "34%", top: 30 }}
        />
        <div
          className="fg-neon"
          style={{
            position: "absolute",
            left: "24%",
            top: 48,
            fontFamily: "var(--f-stencil)",
            fontSize: 19,
            letterSpacing: ".16em",
          }}
        >
          ILLUST ARCHIVE
        </div>
      </div>
      <div
        className="fg-hero__lime fg-para"
        data-fg-parallax="-0.12"
        style={{ ["--base-rot"]: "-4.5deg" } as CSSProperties}
        aria-hidden="true"
      />

      {/* 黒いリボンの上に貼るのでライムで抜く */}
      <svg
        className="fg-decal fg-para"
        data-fg-parallax="0.22"
        data-fg-rot="-5"
        style={
          {
            left: "52%",
            top: "73%",
            width: 200,
            height: 66,
            color: "var(--lime)",
            ["--cut"]: "var(--ink)",
            zIndex: 2,
            ["--base-rot"]: "-7deg",
          } as CSSProperties
        }
        aria-hidden="true"
      >
        <use href="#fg-i-skate" />
      </svg>

      <div className="fg-bleed fg-hero__in">
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <span className="fg-hero__kicker">ILLUSTRATION ARCHIVE</span>
            <span className="fg-meter fg-meter--live" aria-hidden="true">
              <i className="on" />
              <i className="on" />
              <i className="on" />
              <i className="on" />
              <i />
              <i />
            </span>
          </div>

          <h1 className="fg-hero__t jp-break">{SITE_NAME}</h1>

          <p className="fg-hero__lead jp-break">{SITE_DESCRIPTION}</p>

          <div className="fg-hero__cta">
            <a className="fg-btn fg-btn--lime" href="#fg-gallery">
              &#9654; 作品を見る
            </a>
            {cube.length > 0 && (
              <a
                className="fg-btn fg-btn--outline"
                href={`/works/${cube[0].id}`}
              >
                最新作
              </a>
            )}
          </div>
        </div>

        {cube.length > 0 && (
          // 6面に最新作品を貼った CSS 3D のブラウン管。カーソル追従は JS
          <div className="fg-stage" id="fg-stage" aria-hidden="true">
            <div className="fg-cube" id="fg-cube">
              {FACES.map((face, n) => {
                const work = cube[n % cube.length];
                return (
                  <div
                    key={face}
                    className={`fg-cube__face fg-cube__face--${face}`}
                  >
                    <WorkImage work={work} sizes={SIZES_CUBE} alt="" />
                  </div>
                );
              })}
            </div>
            <div className="fg-stage__hint">DRAG YOUR CURSOR</div>
          </div>
        )}
      </div>

      <a className="fg-hero__scroll" href="#fg-gallery">
        SCROLL
        <i aria-hidden="true" />
      </a>
    </section>
  );
}
