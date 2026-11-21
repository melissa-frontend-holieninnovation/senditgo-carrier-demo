import{b8 as Z,b9 as se,a1 as re,aC as le,ac as de,V as j,ba as O,r as f,aU as _,aA as R,m as ce,j as t,B as pe,A as xe,bb as W,E as fe,bc as ue,ah as he,y as A,bd as me,be as ge,bf as ye,bg as we,P as r,l as u,Q as d,bh as be,aL as $e,bi as ve,bj as je,ai as Ae,R as ke,bk as Ce}from"./index-BFaa-tj7.js";import{a as Se,u as Ie}from"./SettingsSection-s-8cEHuH.js";import{w as Oe}from"./NotificationOrderSection-BiETdKAo.js";import"./room-DhjRCOsK.js";import"./OrderList-BZQ9dAPR.js";const U={driver:"Driver",delivery:"Delivery",roster:"Roster",system:"System"},Re=["driver","delivery","roster","system"];function Ge(e,a){return e.map(o=>{var c;if(o.shiftId===void 0)return o;const n=((c=a.find(h=>h.id===o.shiftId))==null?void 0:c.name)??"a Shift",s=h=>h.split("{shift}").join(n);return{...o,title:s(o.title),text:s(o.text),reference:s(o.reference)}})}function q(e,a){const o=a.query.trim().toLowerCase();return e.filter(n=>a.fleetIds.includes(n.fleetId)).filter(n=>a.fleetId==="all"||n.fleetId===a.fleetId).filter(n=>a.category==="all"||n.category===a.category).filter(n=>a.view==="all"||!n.read).filter(n=>!o||`${n.title} ${n.text} ${n.reference}`.toLowerCase().includes(o)).sort((n,s)=>s.createdAt.localeCompare(n.createdAt))}const V=e=>Date.parse(`${e}:00Z`)/6e4,k=(e,a)=>a.days>0&&V(a.now)-V(e)<a.days*24*60,Y=(e,a)=>a.includes(e)?a.indexOf(e):a.length;function Ne(e,a){return[...e].sort((o,n)=>{const s=k(o.createdAt,a),c=k(n.createdAt,a);return s&&c?Y(o.category,a.order)-Y(n.category,a.order)||n.createdAt.localeCompare(o.createdAt):s!==c?s?-1:1:n.createdAt.localeCompare(o.createdAt)})}const Q={today:"Today",yesterday:"Yesterday",older:"Older",priority:"Priority order"};function Pe(e,a){const o=e.filter(s=>k(s.createdAt,a));if(new Set(o.map(s=>s.category)).size<2)return null;const n=e.filter(s=>!k(s.createdAt,a));return[{key:"priority",items:o},{key:"older",items:n}].filter(s=>s.items.length>0)}const C=e=>e.slice(0,10),K=(e,a)=>C(e)===a?"today":C(e)===se(a,-1)?"yesterday":"older";function Ee(e,a){return["today","yesterday","older"].map(o=>({key:o,items:e.filter(n=>K(n.createdAt,a)===o)})).filter(o=>o.items.length>0)}const Le=(e,a,o=!0)=>{const n=K(e,a);return n==="today"||o&&n==="yesterday"?e.slice(11,16):Z(C(e))},De=e=>`${Z(C(e))}, ${e.slice(11,16)}`,Te=e=>{const a=e.reference.trim().toLowerCase();return!!a&&!`${e.title} ${e.text}`.toLowerCase().includes(a)},Fe=e=>`End of list · ${e} ${e===1?"notification":"notifications"}`,Be=12/2,Me=1440,ze=u.div`
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  gap: ${r.sectionGap}px;
`,_e=u(Ce)`
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
`,We=u.div`
  flex: none;
  display: flex;
  align-items: center;
  gap: ${r.toolbarGap}px;
  min-height: 56px;
  padding: ${r.inlineGap}px ${r.textActionGap}px;
  box-shadow: inset 0 -1px 0 ${d("color-border-subtle")};
  white-space: nowrap;
  min-width: 0;
  & [data-search-field] { flex: 0 1 280px; min-width: 160px; }
  & .ant-select { width: 176px; flex: none; }
  @media (max-width: 1279px) { & .ant-select { width: 160px; } }
`,Ue=u.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: ${r.inlineGap}px 0 ${r.textActionGap}px;
`,qe=u.section`
  & > h2 {
    ${Ae}
    margin: 0;
    padding: ${r.textActionGap}px ${r.cardPadding}px ${r.stackTight}px;
    color: ${d("color-text-secondary")};
  }
  & > ul { list-style: none; margin: 0; padding: 0 ${r.inlineGap}px; display: grid; }
`,Ve=u.button`
  all: unset;
  box-sizing: border-box;
  width: 100%;
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  column-gap: ${r.textActionGap}px;
  align-items: ${({$compact:e})=>e?"center":"start"};
  min-height: ${({$compact:e})=>e?36:64}px;
  padding: ${({$compact:e})=>e?`0 ${r.cardPadding-r.inlineGap}px`:`${r.textActionGap}px ${r.cardPadding-r.inlineGap}px`};
  border-radius: ${ke.control}px;
  cursor: pointer;
  background: ${({$open:e})=>e?d("color-fill-selected"):"transparent"};
  &:hover { background: ${({$open:e})=>e?d("color-fill-selected"):d("color-fill-hover")}; }
  &:focus-visible { outline: 2px solid ${d("color-focus")}; outline-offset: -2px; }
  & .nc-dot { width: 8px; height: 8px; border-radius: 50%; align-self: ${({$compact:e})=>e?"center":"start"}; margin-top: ${({$compact:e})=>e?0:Be}px; }
  & .nc-dot[data-unread] { background: ${d("color-action-text")}; }
  & .nc-main { display: grid; min-width: 0; }
  & .nc-title { font-size: 14px; line-height: 20px; font-weight: 600; color: ${d("color-text-primary")}; overflow-wrap: anywhere; }
  & .nc-title[data-read] { font-weight: 400; }
  & .nc-text { font-size: 14px; line-height: 20px; color: ${d("color-text-secondary")}; overflow-wrap: anywhere; }
  & .nc-time { font-size: 13px; line-height: 20px; color: ${d("color-text-secondary")}; font-variant-numeric: tabular-nums; white-space: nowrap; }
`,Ye=u.p`
  margin: ${r.textActionGap}px ${r.cardPadding}px 0;
  display: flex;
  align-items: center;
  gap: ${r.textActionGap}px;
  font-size: 12px;
  line-height: 16px;
  color: ${d("color-text-secondary")};
  &::before, &::after { content: ''; flex: 1 1 auto; height: 1px; background: ${d("color-border-subtle")}; }
`,Qe=u.div`
  flex: none;
  display: flex;
  min-height: 0;
  @media (max-width: ${Me-1}px) {
    position: absolute;
    z-index: ${ve.sticky+2};
    top: 0;
    right: 0;
    bottom: 0;
    width: 480px;
    & > aside { box-shadow: ${d("shadow-panel")}; }
  }
  @media (max-width: 1279px) { width: 440px; }
`,Ze=u.div`
  display: grid;
  gap: ${r.formRowGap}px;
  & > p { margin: 0; font-size: 14px; line-height: 22px; color: ${d("color-text-primary")}; }
  & > .nc-way { justify-self: start; }
`,Ke=u.span`
  display: inline-flex;
  align-items: center;
  gap: ${r.inlineGap}px;
  & [data-brand-part='demo-chip'] { font-style: normal; }
`;function Xe({list:e,compact:a,openedId:o,onOpen:n,priority:s}){const c=Pe(e,s),h=c??Ee(e,R);return t.jsx(t.Fragment,{children:h.map(p=>t.jsxs(qe,{"aria-labelledby":`nc-${p.key}`,"data-testid":`nc-group-${p.key}`,children:[t.jsx("h2",{id:`nc-${p.key}`,children:p.key==="priority"?`${Q.priority} · ${Oe(s.days)}`:Q[p.key]}),t.jsx("ul",{children:p.items.map(l=>t.jsx("li",{children:t.jsxs(Ve,{type:"button",$compact:a,$open:l.id===o,onClick:()=>n(l.id),"aria-label":`Open notification ${l.title}`,"aria-current":l.id===o||void 0,"data-testid":`nc-row-${l.id}`,"data-unread":!l.read||void 0,children:[t.jsx("span",{className:"nc-dot","data-unread":!l.read||void 0,"aria-hidden":!0}),t.jsxs("span",{className:"nc-main",children:[t.jsxs("span",{className:"nc-title","data-read":l.read||void 0,children:[l.title,!l.read&&t.jsx(je,{children:" (unread)"})]}),!a&&t.jsx("span",{className:"nc-text",children:l.text})]}),t.jsx("span",{className:"nc-time",children:Le(l.createdAt,R,!c)})]})},l.id))})]},p.key))})}function He({list:e,compact:a,view:o,narrowed:n,openedId:s,onOpen:c,onClear:h,priority:p}){return Ie().loading?t.jsx(be,{rows:6,testId:"nc-loading"}):e.length===0?t.jsx($e,{compact:!0,title:o==="unread"&&!n?"No unread notifications":"No notifications found",body:n?"Try another word or filter.":void 0,action:n||o==="unread"?t.jsx(A,{onClick:h,"data-testid":"nc-clear",children:n?"Clear Filters":"Show All"}):void 0}):t.jsxs(t.Fragment,{children:[t.jsx(Xe,{list:e,compact:a,openedId:s,onOpen:c,priority:p}),t.jsx(Ye,{"data-testid":"nc-end",children:Fe(e.length)})]})}function nt(){const e=re(),a=le(),[o,n]=de(),s=j(i=>i.world.fleets),c=j(i=>i.fleetId),h=j(i=>i.setFleet),p=j(i=>i.world.shifts),l=O(i=>i.list),g=f.useMemo(()=>Ge(l,p),[l,p]),X=O(i=>i.markRead),H=O(i=>i.markAllRead),[y,G]=f.useState("all"),[w,N]=f.useState(""),[b,P]=f.useState("all"),[$,E]=f.useState("all"),[L,J]=f.useState(!1),[D,T]=f.useState(),v=f.useMemo(()=>s.map(i=>i.id),[s]),F=_(i=>i.profile.notificationOrder),B=_(i=>i.profile.priorityWindowDays),S=f.useMemo(()=>({order:F,days:B,now:`${R}T${ce}`}),[F,B]),ee=f.useMemo(()=>Ne(q(g,{view:y,query:w,category:b,fleetId:$,fleetIds:v}),S),[g,y,w,b,$,v,S]),I=f.useMemo(()=>q(g,{view:"all",query:"",category:"all",fleetId:"all",fleetIds:v}),[g,v]),x=D?I.find(i=>i.id===D):void 0,M=I.filter(i=>!i.read),z=i=>{T(i),X(i)};f.useEffect(()=>{const i=o.get("message");if(!i)return;I.some(oe=>oe.id===i)?z(i):a.warn("Notification not found. It may have been removed or is hidden by the current filter.",{key:"nc-missing"});const m=new URLSearchParams(o);m.delete("message"),n(m,{replace:!0})},[]);const te=()=>{const i=H(M.map(m=>m.id));a.done("All notifications marked as read",{undo:i,key:"nc-read-all"})},ae=i=>{i.fleetId!==c&&s.some(m=>m.id===i.fleetId)&&h(i.fleetId),e(i.link.to)},ie=w.trim()!==""||b!=="all"||$!=="all",ne=()=>{G("all"),N(""),P("all"),E("all")};return t.jsx(Se,{eyebrow:"Settings",title:t.jsxs(Ke,{children:[t.jsx(ye,{id:"nc:center",n:1,at:"right",children:"Notifications"})," ",t.jsx(we,{})]}),line:"Messages for the Fleets you can see.",wide:!0,testId:"notification-center",action:t.jsxs(t.Fragment,{children:[M.length>0&&t.jsx(A,{icon:t.jsx(me,{}),onClick:te,"data-testid":"nc-mark-all-read",children:"Mark All Read"}),t.jsx(A,{icon:t.jsx(ge,{}),onClick:()=>e("/settings/notifications"),"data-testid":"nc-open-settings",children:"Open In Settings"})]}),children:t.jsxs(ze,{children:[t.jsxs(_e,{"data-testid":"nc-list",children:[t.jsxs(We,{role:"toolbar","aria-label":"Notifications","data-testid":"nc-toolbar",children:[t.jsx(pe,{label:"Show",size:"md",value:y,onChange:G,options:[{value:"all",label:"All",testId:"nc-view-all"},{value:"unread",label:"Unread",testId:"nc-view-unread"}],"data-testid":"nc-view"}),t.jsx(xe,{value:w,onChange:N,placeholder:"Search notifications",testId:"nc-search"}),t.jsx(W,{"aria-label":"Category",value:b,onChange:P,"data-testid":"nc-category",options:[{value:"all",label:"All categories"},...Re.map(i=>({value:i,label:U[i]}))]}),t.jsx(W,{"aria-label":"Fleet",value:$,onChange:E,"data-testid":"nc-fleet",options:[{value:"all",label:"All Fleets"},...s.map(i=>({value:i.id,label:i.name}))]}),t.jsx(fe,{checked:L,onChange:J,testId:"nc-compact",children:"Compact"})]}),t.jsx(Ue,{"data-testid":"nc-scroll",children:t.jsx(He,{list:ee,compact:L,view:y,narrowed:ie,openedId:x==null?void 0:x.id,onOpen:z,onClear:ne,priority:S})})]}),x&&t.jsx(Qe,{"data-testid":"nc-panel-spot",children:t.jsx(ue,{open:!0,onClose:()=>T(void 0),eyebrow:"Notification",title:x.title,testId:"nc-panel",children:t.jsxs(Ze,{children:[t.jsx("p",{"data-testid":"nc-panel-text",children:x.text}),t.jsx(he,{columns:1,items:[{label:"Category",value:U[x.category]},...Te(x)?[{label:"Reference",value:x.reference}]:[],{label:"Created",value:De(x.createdAt)}]}),t.jsx(A,{size:"small",className:"nc-way",onClick:()=>ae(x),"data-testid":"nc-panel-open",children:`Open In ${x.link.page}`})]})})})]})})}export{nt as NotificationCenterPage};
