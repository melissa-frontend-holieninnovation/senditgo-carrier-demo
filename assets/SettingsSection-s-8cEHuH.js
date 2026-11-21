import{r as i,aU as m,j as t,a4 as L,y as k,P as x,l as b,ac as z,V as U,af as H,bC as _,b2 as J,Q as G,a0 as V,cs as W,bf as q,ct as K,bh as Q,cu as Y,cv as X,bk as Z}from"./index-BFaa-tj7.js";import{s as T,c as B,a as ee,M as te,l as se}from"./room-DhjRCOsK.js";const ae=4e3,I=i.createContext(!1),N=(e,n)=>JSON.stringify(e)===JSON.stringify(n);function ne({editing:e,stored:n,write:o}){const l=i.useContext(I),a=i.useRef(n),c=i.useRef(n);c.current=n;const[d,p]=i.useState(null);i.useEffect(()=>{a.current=c.current,p(null)},[e]);const u=i.useRef(o);return u.current=o,i.useEffect(()=>{if(!e||!l||!u.current)return;const w=window.setTimeout(()=>{u.current&&m.getState().byOther(u.current)},ae);return()=>window.clearTimeout(w)},[e,l]),{flag:d,blocked:()=>N(c.current,a.current)?!1:(p(m.getState().lastOther??{by:"Another user",at:""}),!0),settle:()=>{a.current=c.current,p(null)},base:()=>a.current}}const ie=b.div`
  display: grid;
  gap: ${x.inlineGap}px;
  justify-items: start;
  & .ou-act { display: flex; gap: ${x.inlineGap}px; white-space: nowrap; }
`;function re({record:e,who:n,onAdjust:o,onRefresh:l,testId:a="settings-other-flag"}){return t.jsxs(ie,{"data-testid":a,role:"alert",children:[t.jsx(L,{kind:"changed",sentence:`${n.by} changed ${e}${n.at?` at ${n.at}`:""}. Your changes are still here.`,testId:`${a}-sentence`}),t.jsxs("span",{className:"ou-act",children:[t.jsx(k,{size:"small",onClick:o,"data-testid":`${a}-adjust`,children:"Adjust"}),t.jsx(k,{size:"small",onClick:l,"data-testid":`${a}-refresh`,children:"Refresh"})]})]})}function $e(e,n,o){const l={...o};for(const a of Object.keys(e))N(e[a],n[a])||(l[a]=e[a]);return l}const D=400,M=i.createContext({loading:!1,failed:()=>!1,retrying:()=>!1,retry:()=>{}}),oe=()=>i.useContext(M),le=b.div`
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: ${({$wide:e})=>e?"hidden":"auto"};
  display: flex;
  flex-direction: column;
  background: ${G("color-bg-canvas")};
  color: ${G("color-text-primary")};
  /* The frame owns the side gutter; the page adds only top and bottom. */
  padding-block: var(--page-top) calc(var(--page-top) * 2);
  & > [data-progress-line] { position: absolute; top: 0; left: 0; right: 0; }
`,ce=b.div`
  ${({$wide:e})=>e?"flex: 1 1 auto; min-height: 0;":"flex: none;"}
  display: flex;
  flex-direction: column;
  gap: ${x.sectionGap}px;
  max-width: ${({$wide:e})=>e?"none":"1600px"};
  @media (max-width: 1279px) { max-width: none; }
`,de=b.div`
  display: flex;
  flex-direction: column;
  ${T}
  & > .sp-stack { display: flex; flex-direction: column; ${T} min-width: 0; }
  @media (min-width: 1280px) {
    ${({$two:e})=>e?V`display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: start; ${B}`:""}
  }
`;function ye({eyebrow:e,title:n,line:o,action:l,failId:a,wide:c=!1,side:d,testId:p,children:u}){const[w]=z(),v=w.get("settingsFail"),[S]=i.useState(()=>w.get("settingsOther")==="1"),[r,C]=i.useState(!0),[f,O]=i.useState(()=>v?v==="1"?a?[a]:[]:[v]:[]),[F,h]=i.useState([]);i.useEffect(()=>{const s=window.setTimeout(()=>C(!1),D);return()=>window.clearTimeout(s)},[]);const E=U(s=>s.role),j=m(s=>s.setEditing);i.useEffect(()=>()=>j(null),[j]),i.useEffect(()=>j(null),[E,j]);const R=m(s=>s.pendingDiscard),$=m(s=>s.askDiscard),g=i.useCallback(s=>{h(y=>[...y,s]),window.setTimeout(()=>{h(y=>y.filter(P=>P!==s)),O(y=>y.filter(P=>P!==s))},D)},[]),A=i.useMemo(()=>({loading:r,failed:s=>f.includes(s),retrying:s=>F.includes(s),retry:g}),[r,f,F,g]);return t.jsxs(M.Provider,{value:A,children:[t.jsx(I.Provider,{value:S,children:t.jsxs(le,{$wide:c,"data-testid":p,"data-settings-page":!0,"aria-busy":r||void 0,children:[t.jsx(H,{active:r,label:"Loading settings"}),t.jsxs(ce,{$wide:c,children:[t.jsx(_,{eyebrow:e,title:n,description:o,action:l}),c?u:t.jsxs(de,{$two:!!d,"data-settings-columns":d?2:1,children:[t.jsx("div",{className:"sp-stack","data-settings-main":!0,children:u}),d&&t.jsx("div",{className:"sp-stack","data-settings-side":!0,children:d})]})]})]})}),t.jsx(J,{open:!!R,size:"sm",tone:"danger",title:"Discard your changes?",lead:"What you typed in the other section isn't saved.",initialFocus:"dismiss",onRequestClose:()=>$(null),dismiss:{label:"Keep Editing",onClick:()=>$(null),testId:"discard-keep"},primary:{label:"Discard",danger:!0,onClick:()=>{const s=R;$(null),s==null||s()},testId:"discard-confirm"},"data-testid":"discard-dialog"})]})}const ue=300,fe=b(Z)`
  ${ee}
  gap: ${x.formRowGap}px;
  & [data-brand-part='section-header'] { margin: 0; align-items: flex-start; }
  /* A card can be wide: its lead and its sentences never run past a readable line. */
  & [data-brand-part='section-header'] .bk-desc, & p { max-width: ${te}; }
  /* The lead sits 8 under the title (the header's own stack gap), not 12. */
  & [data-brand-part='section-header'] .bk-desc { margin-top: 0; }
  & .ss-head-note { margin-top: -${x.inlineGap}px; }
  & .ss-title-after { margin-left: ${x.inlineGap}px; vertical-align: middle; font-style: normal; }
  ${se}
`,pe=b.div`
  display: flex;
  justify-content: flex-end;
  gap: ${x.inlineGap}px;
  padding-top: ${x.formRowGap}px;
  border-top: 1px solid ${G("color-border-subtle")};
`,ge=b.div`
  display: flex;
  align-items: center;
  gap: ${x.formRowGap}px;
  & > span { flex: 0 1 auto; min-width: 0; }
  & > button { flex: none; }
  font-size: 14px;
  line-height: 22px;
  color: ${G("color-text-primary")};
`,xe=e=>m(n=>n.editing===e);function me(){return(e,n)=>{const{editing:o,dirty:l,setEditing:a,askDiscard:c}=m.getState(),d=()=>{n(),a(e)};o&&o!==e&&l?c(d):d()}}function be({id:e,title:n,titleAfter:o,lead:l,note:a,editable:c=!1,onBeginEdit:d,onSave:p,action:u,editLabel:w="Edit",foot:v,review:S,other:r,children:C}){const f=xe(e),O=m(y=>y.setEditing),F=me(),h=oe(),[E,j]=i.useState(!1),R=h.failed(e),$=h.loading||h.retrying(e),g=ne({editing:f,stored:r==null?void 0:r.stored,write:r==null?void 0:r.write}),A=()=>{E||(j(!0),window.setTimeout(()=>{j(!1),!g.blocked()&&(p==null?void 0:p())!==!1&&O(null)},ue))},s=!$&&!R&&(u||c&&!f)?t.jsxs(t.Fragment,{children:[u,c&&!f&&t.jsx(k,{icon:t.jsx(X,{}),onClick:()=>F(e,()=>d==null?void 0:d()),"data-testid":`${e}-edit`,children:w})]}):void 0;return t.jsxs(fe,{"data-settings-section":e,"data-testid":`section-${e}`,"aria-labelledby":`${e}-title`,"aria-busy":$||void 0,children:[t.jsx(W,{as:"h2",size:"md",description:l,action:s,title:t.jsxs(t.Fragment,{children:[S?t.jsx(q,{id:S.id,n:S.n,at:"right",children:t.jsx("span",{id:`${e}-title`,children:n})}):t.jsx("span",{id:`${e}-title`,children:n}),o&&t.jsx("span",{className:"ss-title-after",children:o})]})}),a&&!f&&t.jsx("div",{className:"ss-head-note",children:t.jsx(K,{testId:`${e}-note`,children:a})}),$?t.jsx(Q,{rows:3,testId:`${e}-loading`}):R?t.jsxs(ge,{role:"alert","data-testid":`${e}-failed`,children:[t.jsx("span",{children:"This section didn't load. Everything else on the page still works."}),t.jsx(k,{icon:t.jsx(Y,{}),onClick:()=>h.retry(e),"data-testid":`${e}-retry`,children:"Try Again"})]}):t.jsxs(t.Fragment,{children:[typeof C=="function"?C(f):C,f&&r&&g.flag&&t.jsx(re,{record:r.record,who:g.flag,testId:`${e}-other`,onAdjust:()=>{r.adjust(g.base()),g.settle()},onRefresh:()=>{r.refresh(),g.settle()}}),f&&t.jsx(pe,{children:v??t.jsxs(t.Fragment,{children:[t.jsx(k,{onClick:()=>O(null),disabled:E,"data-testid":`${e}-cancel`,children:"Cancel"}),t.jsx(k,{kind:"primary",loading:E,onClick:A,"data-testid":`${e}-save`,children:"Save"})]})})]})]})}export{re as O,be as S,ye as a,xe as b,ne as c,ue as d,$e as k,oe as u};
