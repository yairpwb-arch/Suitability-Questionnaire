"use client";

import { useRef, useState, type FormEvent } from "react";
import styles from "./page.module.css";

const DURATION_OPTIONS = [
  "מתחת ל-3 חודשים",
  "חצי שנה",
  "שנה ומעלה",
  "כל החיים...",
];

type TeamMedia = {
  id: number;
  type: "image" | "video";
  src: string;
};

const TEAM_MEDIA: TeamMedia[] = [
  { id: 1, type: "image", src: "/team/01.jpeg" },
  { id: 2, type: "image", src: "/team/02.jpeg" },
  { id: 3, type: "video", src: "/team/03.mp4" },
  { id: 4, type: "image", src: "/team/04.jpeg" },
  { id: 5, type: "image", src: "/team/05.jpeg" },
  { id: 6, type: "video", src: "/team/06.mp4" },
  { id: 7, type: "image", src: "/team/07.jpeg" },
];

export default function Home() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [duration, setDuration] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [userStopped, setUserStopped] = useState(false);
  const [playingKeys, setPlayingKeys] = useState<Set<string>>(new Set());
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const carouselPaused = isHovering || userStopped;
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch("/api/submit-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, duration, reason }),
      });
      if (!res.ok) throw new Error("submit failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  function playVideo(key: string) {
    setUserStopped(true);
    setPlayingKeys((prev) => new Set(prev).add(key));
    videoRefs.current.get(key)?.play();
  }

  return (
    <>
      <header className={styles.header}>
        <span className={styles.logoDot} aria-hidden />
      </header>

      <main className={styles.page}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.hero}>
            <h1 className={styles.title}>
              לשיחת התאמה לתוכנית
              <br />
              וקבלת ההטבה! <span aria-hidden>👇</span>
            </h1>
            <p className={styles.subtitle}>
              הטופס מיועד לגברים ונשים שרוצים להיפטר אחת ולתמיד מהשומן העודף
              בבטן באמצעות שינוי הרגלי אכילה. בלי תפריט ובלי מלחמות עם
              עצמכם.
            </p>
          </div>

          <div className={styles.fieldGroup}>
            <input
              className={styles.input}
              type="text"
              name="name"
              placeholder="איך קוראים לך?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
            <input
              className={styles.input}
              type="tel"
              name="phone"
              placeholder="0547588909"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
            />
          </div>

          <div
            className={styles.question}
            role="radiogroup"
            aria-labelledby="duration-question"
          >
            <p id="duration-question" className={styles.questionTitle}>
              כמה זמן ניסית לשנות את הגוף שלך?
            </p>
            <div className={styles.options}>
              {DURATION_OPTIONS.map((option) => (
                <label
                  key={option}
                  className={`${styles.optionBox} ${
                    duration === option ? styles.optionBoxSelected : ""
                  }`}
                >
                  <input
                    className={styles.radioInput}
                    type="radio"
                    name="duration"
                    value={option}
                    checked={duration === option}
                    onChange={() => setDuration(option)}
                    required
                  />
                  <span className={styles.radioVisual} aria-hidden />
                  <span className={styles.optionText}>{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.question}>
            <label htmlFor="reason" className={styles.questionTitle}>
              שאלה אחרונה! למה חשוב לך לעשות שינוי עכשיו?
            </label>
            <textarea
              id="reason"
              className={styles.textarea}
              placeholder="פרט..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>

          <label className={styles.checkboxRow}>
            <input
              className={styles.checkboxInput}
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
            />
            <span className={styles.checkboxText}>
              אני מבין/ה שהתוכנית בתשלום וההטבה היא התחייבות לתוצאות או החזר
              כספי מלא
            </span>
          </label>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "שולח..." : "אני רוצה שיחזרו אלי!"}
          </button>

          {status === "success" && (
            <p className={styles.formStatusSuccess}>
              תודה! קיבלנו את הפרטים ונחזור אליך בקרוב.
            </p>
          )}
          {status === "error" && (
            <p className={styles.formStatusError}>
              משהו השתבש בשליחה, נסה/י שוב או צור/י קשר ישירות.
            </p>
          )}

          <div className={styles.carouselSection}>
            <h2 className={styles.carouselTitle}>אנשים בתוכנית שלנו:</h2>
            <div
              className={styles.carouselViewport}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onPointerDown={() => setUserStopped(true)}
            >
              <div
                className={styles.carouselTrack}
                style={{
                  animationPlayState: carouselPaused ? "paused" : "running",
                }}
              >
                {[...TEAM_MEDIA, ...TEAM_MEDIA].map((media, i) => {
                  const key = `${media.id}-${i}`;
                  const started = playingKeys.has(key);
                  return (
                    <div key={key} className={styles.carouselItem}>
                      {media.type === "video" ? (
                        <>
                          <video
                            ref={(el) => {
                              if (el) videoRefs.current.set(key, el);
                            }}
                            className={styles.carouselImage}
                            src={media.src}
                            playsInline
                            controls={started}
                            onPlay={() => setUserStopped(true)}
                          />
                          {!started && (
                            <button
                              type="button"
                              className={styles.playButton}
                              onClick={() => playVideo(key)}
                              aria-label="נגן סרטון"
                            >
                              ▶
                            </button>
                          )}
                        </>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={media.src}
                          alt=""
                          className={styles.carouselImage}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
