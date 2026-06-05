import { useState, useEffect } from "react";
import "./App.css";
import Doll from "./components/doll";
import Controls from "./components/controls";
import Match3 from "./components/match3";

import pose1 from "./assets/new_assets/pose_1.png";
import pose2 from "./assets/new_assets/pose_2.png";
import pose3 from "./assets/new_assets/pose_3.png";
import pose4 from "./assets/new_assets/pose_4.png";
import pose5 from "./assets/new_assets/pose_5.png";

import blondeHair from "./assets/new_assets/hair_3.png";
import brownHair from "./assets/new_assets/hair_1.png";
import pinkHair from  "./assets/new_assets/hair_2.png";
import purpleHair from "./assets/new_assets/hair_4.png";
import lavenderHair from  "./assets/new_assets/hair_7.png";
import blueHair from "./assets/new_assets/hair_6.png";
import greenHair from "./assets/new_assets/hair_5.png";

import blueDress from "./assets/new_assets/dress_1.png";
import purpleDress from "./assets/new_assets/dress_2.png";
import pinkDress from "./assets/new_assets/dress_4.png";
import greenDress from "./assets/new_assets/dress_3.png";


 function App() {
 
  const [selectedHair, setSelectedHair] = useState("blonde");
  const [selectedDress, setSelectedDress] = useState("blue");
  
  const [moneyEarned, setMoneyEarned] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [showWorkGame, setShowWorkGame] = useState(false);
  const poses = [pose1, pose2, pose3, pose4, pose5];
  const [poseIndex, setPoseIndex] = useState(0);
  const [showCloset, setShowCloset] = useState(false);
  const [ownedItems, setOwnedItems] = useState(() => ({
    Hair: ["blonde"],
    Dress: ["blue"],
  }));

  // pose cycling moved into Scrapbook modal — no global cycle in the hub

  const [showScrapbook, setShowScrapbook] = useState(false);
  const [scrapbookPhotos, setScrapbookPhotos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('scrapbook_photos') || '[]');
    } catch (e) { return []; }
  });

  const hairOptions = [
    { id: "blonde", label: "Blonde", asset: blondeHair },
    { id: "brown", label: "Brown", asset: brownHair },
    { id: "pink", label: "Pink", asset: pinkHair },
    { id: "purple", label: "Purple", asset: purpleHair },
    { id: "lavendar", label: "Lavendar", asset: lavenderHair },
    { id: "blue", label: "Blue", asset: blueHair },
    { id: "green", label: "Green", asset: greenHair },
  ];



  const dressOptions = [
    { id: "blue", label: "Blue Dress", asset: blueDress },
    { id: "purple", label: "Purple Dress", asset: purpleDress },
    { id: "pink", label: "Pink Dress", asset: pinkDress },
    { id: "green", label: "Green Dress", asset: greenDress }
  ];

  

  const closetGroups = [
    {
      title: "Body",
      sections: [
        {
          title: "Hair",
          selected: selectedHair,
          options: hairOptions,
          onSelect: setSelectedHair,
        },
      ],
    },
    {
      title: "Clothes",
      sections: [
        {
          title: "Dress",
          selected: selectedDress,
          options: dressOptions,
          onSelect: setSelectedDress,
        }
      ],
    },
  ];
  
  const currentHair = hairOptions.find((item) => item.id === selectedHair)?.asset;
  const currentDress = dressOptions.find((item) => item.id === selectedDress)?.asset;
  

  const dollPanel = ({ showStartButton = false } = {}) => (
    <div className="doll-card">
      <div className="stage-frame">
        <p className="stage-label">Preview</p>
        <Doll
          body={poses[poseIndex]}
          hair={currentHair}
          dress={currentDress}
        />
      </div>

      {showStartButton && (
        <button
          type="button"
          className="start-button"
          onClick={() => {
            try { localStorage.removeItem('match3_save'); } catch {}
            setIsStarted(true);
          }}
        >
          START!
        </button>
      )}
    </div>
  );

  if (isStarted) {
    return (
      <main className="app-shell showcase-shell">
        <div className="game-hud" aria-label="Game hub">
          <div className="hud-coins" aria-label="Coins earned">
            <span className="hud-label">Coins</span>
            <strong>{moneyEarned}</strong>
          </div>

          <button type="button" className="hud-button hud-top-right">
            Closet
          </button>

          <button type="button" className="hud-button hud-top-right" onClick={() => setShowCloset(true)}>
            Closet
          </button>

          <button
            type="button"
            className="hud-button hud-bottom-left"
            onClick={() => setShowWorkGame(true)}
          >
            Work
          </button>

          <button type="button" className="hud-button hud-bottom-right" onClick={() => setShowScrapbook(true)}>
            Scrapbook
          </button>
        </div>

        <section className="showcase-stage" aria-label="Created character">
          <div className="doll-panel doll-panel-centered">{dollPanel()}</div>
        </section>
        {showWorkGame && (
          <Match3
            onClose={() => setShowWorkGame(false)}
            onCoinsEarned={(count) => setMoneyEarned((c) => c + count)}
          />
        )}
        {showCloset && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h3>Closet</h3>
                <button onClick={() => setShowCloset(false)}>Close</button>
              </div>
              <Controls
                groups={closetGroups}
                ownedItems={ownedItems}
                onPurchase={(sectionTitle, itemId) => {
                  if (moneyEarned < 200) { alert('Not enough coins'); return; }
                  setMoneyEarned((m) => m - 200);
                  setOwnedItems((prev) => ({
                    ...prev,
                    [sectionTitle]: Array.from(new Set([...(prev[sectionTitle] || []), itemId])),
                  }));
                  // auto-select after purchase
                  if (sectionTitle === 'Hair') setSelectedHair(itemId);
                  if (sectionTitle === 'Dress') setSelectedDress(itemId);
                }}
              />
            </div>
          </div>
        )}
        {showScrapbook && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h3>Scrapbook</h3>
                <button onClick={() => setShowScrapbook(false)}>Close</button>
              </div>

              <ScrapbookModal
                poses={poses}
                currentHair={currentHair}
                currentDress={currentDress}
                photos={scrapbookPhotos}
                onTakePhoto={async (dataUrl) => {
                  const next = [dataUrl, ...scrapbookPhotos];
                  setScrapbookPhotos(next);
                  try { localStorage.setItem('scrapbook_photos', JSON.stringify(next)); } catch {}
                }}
                onDeletePhoto={(index) => {
                  const next = scrapbookPhotos.filter((_,i) => i !== index);
                  setScrapbookPhotos(next);
                  try { localStorage.setItem('scrapbook_photos', JSON.stringify(next)); } catch {}
                }}
              />
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-hero">
        <div className="hero-copy">
          <p className="eyebrow">Dress up studio</p>
          <h1>create your character</h1>
        </div>
      </header>

      <section className="studio-layout" aria-label="Character creator">
        <div className="doll-panel">{dollPanel({ showStartButton: true })}</div>

        <Controls groups={closetGroups} />
      </section>
    </main>
  );
}
function ScrapbookModal({ poses, currentHair, currentDress, photos = [], onTakePhoto = () => {}, onDeletePhoto = () => {} }) {
  const [poseIndexLocal, setPoseIndexLocal] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPoseIndexLocal((i) => (i + 1) % poses.length), 500);
    return () => { clearInterval(id); setPoseIndexLocal(0); };
  }, [poses.length]);

  const capture = async () => {
    try {
      const load = (src) => new Promise((res, rej) => {
        const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => res(img); img.onerror = rej; img.src = src;
      });

      const bodyImg = await load(poses[poseIndexLocal]);
      const w = bodyImg.naturalWidth || bodyImg.width || 512;
      const h = bodyImg.naturalHeight || bodyImg.height || 512;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0,0,w,h);
      ctx.drawImage(bodyImg, 0, 0, w, h);
      if (currentDress) {
        const dressImg = await load(currentDress);
        ctx.drawImage(dressImg, 0, 0, w, h);
      }
      if (currentHair) {
        const hairImg = await load(currentHair);
        ctx.drawImage(hairImg, 0, 0, w, h);
      }

      const dataUrl = canvas.toDataURL('image/png');
      onTakePhoto(dataUrl);
    } catch (e) {
      console.error('scrapbook capture failed', e);
      alert('Unable to capture photo.');
    }
  };

  return (
    <div>
      <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
        <div style={{flex:'0 0 320px'}}>
          <div className="stage-frame">
            <p className="stage-label">Scrapbook Preview</p>
            <Doll body={poses[poseIndexLocal]} hair={currentHair} dress={currentDress} />
          </div>
          <div style={{marginTop:12}}>
            <button onClick={capture} className="hud-button">Take Photo</button>
          </div>
        </div>

        <div style={{flex:1}}>
          <h4>Photos</h4>
          <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
            {photos.length === 0 && <div style={{opacity:0.6}}>No photos yet. Use "Take Photo" to capture the preview.</div>}
            {photos.map((p, idx) => (
              <div key={idx} style={{width:140}}>
                <img src={p} alt={`photo-${idx}`} style={{width:'100%',borderRadius:8,border:'1px solid rgba(0,0,0,0.06)'}} />
                <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                  <a href={p} download={`scrapbook-${idx}.png`} className="hud-button">Download</a>
                  <button onClick={() => onDeletePhoto(idx)} className="hud-button">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App