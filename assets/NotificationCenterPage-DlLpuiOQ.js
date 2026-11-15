import{cI as Q,cJ as se,cK as re,m as le,aj as de,aa as ce,ab as j,cL as N,r as h,cx as _,ah as O,y as pe,j as t,a5 as fe,bm as he,bq as U,a9 as me,bE as xe,bG as ue,q as A,cM as ge,cN as ye,cO as we,bh as $e,J as r,l as m,K as d,bL as be,as as ve,cP as je,cQ as Ae,ct as ke,N as Se,c6 as Ce}from"./index-BhPT0T72.js";import{a as Ie,u as Ne}from"./SettingsSection-Cmbn5swY.js";import{w as Oe}from"./NotificationOrderSection-BkCLV4U_.js";import"./room-YbmmTeR-.js";import"./OrderList-B6YgxL5q.js";const W={driver:"Driver",delivery:"Delivery",roster:"Roster",system:"System"},Re=["driver","delivery","roster","system"];function Ge(e,a){return e.map(o=>{var c;if(o.shiftId===void 0)return o;const n=((c=a.find(x=>x.id===o.shiftId))==null?void 0:c.name)??"a Shift",s=x=>x.split("{shift}").join(n);return{...o,title:s(o.title),text:s(o.text),reference:s(o.reference)}})}function q(e,a){const o=a.query.trim().toLowerCase();return e.filter(n=>a.fleetIds.includes(n.fleetId)).filter(n=>a.fleetId==="all"||n.fleetId===a.fleetId).filter(n=>a.category==="all"||n.category===a.category).filter(n=>a.view==="all"||!n.read).filter(n=>!o||`${n.title} ${n.text} ${n.reference}`.toLowerCase().includes(o)).sort((n,s)=>s.createdAt.localeCompare(n.createdAt))}const K=e=>Date.parse(`${e}:00Z`)/6e4,k=(e,a)=>a.days>0&&K(a.now)-K(e)<a.days*24*60,Y=(e,a)=>a.includes(e)?a.indexOf(e):a.length;function Pe(e,a){return[...e].sort((o,n)=>{const s=k(o.createdAt,a),c=k(n.createdAt,a);return s&&c?Y(o.category,a.order)-Y(n.category,a.order)||n.createdAt.localeCompare(o.createdAt):s!==c?s?-1:1:n.createdAt.localeCompare(o.createdAt)})}const J={today:"Today",yesterday:"Yesterday",older:"Older",priority:"Priority order"};function Ee(e,a){const o=e.filter(s=>k(s.createdAt,a));if(new Set(o.map(s=>s.category)).size<2)return null;const n=e.filter(s=>!k(s.createdAt,a));return[{key:"priority",items:o},{key:"older",items:n}].filter(s=>s.items.length>0)}const S=e=>e.slice(0,10),V=(e,a)=>S(e)===a?"today":S(e)===se(a,-1)?"yesterday":"older";function Le(e,a){return["today","yesterday","older"].map(o=>({key:o,items:e.filter(n=>V(n.createdAt,a)===o)})).filter(o=>o.items.length>0)}const De=(e,a,o=!0)=>{const n=V(e,a);return n==="today"||o&&n==="yesterday"?e.slice(11,16):Q(S(e))},Te=e=>`${Q(S(e))}, ${e.slice(11,16)}`,Fe=e=>{const a=e.reference.trim().toLowerCase();return!!a&&!`${e.title} ${e.text}`.toLowerCase().includes(a)},Me=e=>`End of list · ${e} ${e===1?"notification":"notifications"}`;re("nc",{center:{title:"Notification Center",does:"The history of messages for the Fleets you can see: All or Unread, a search, the category and Fleet filters, and a compact view. A row opens its panel with Category, Reference, Created and an Open In button to the page it names. Reference shows only when the title and text do not already name it, so each fact is said once.",changes:"Opening a message marks it read. Mark All Read marks every message read. Nothing else changes.",success:'Mark All Read toasts "All notifications marked as read" with Undo. The order of the categories is set on Settings › Notifications (Open In Settings).',failure:'The twelve messages are demo data, made up for this preview from what the demo shows (notificationsDemo.ts), so the DEMO chip says so. No System message is made up. A filter with no match says "No notifications found"; Unread with none says "No unread notifications". ?message=n-4 opens one; an unknown id says "Notification not found."',basis:"current"}});const ze=12/2,Be=1440,_e=m.div`
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  gap: ${r.sectionGap}px;
`,Ue=m(Ce)`
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
`,We=m.div`
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
`,qe=m.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: ${r.inlineGap}px 0 ${r.textActionGap}px;
`,Ke=m.section`
  & > h2 {
    ${ke}
    margin: 0;
    padding: ${r.textActionGap}px ${r.cardPadding}px ${r.stackTight}px;
    color: ${d("color-text-secondary")};
  }
  & > ul { list-style: none; margin: 0; padding: 0 ${r.inlineGap}px; display: grid; }
`,Ye=m.button`
  all: unset;
  box-sizing: border-box;
  width: 100%;
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  column-gap: ${r.textActionGap}px;
  align-items: ${({$compact:e})=>e?"center":"start"};
  min-height: ${({$compact:e})=>e?36:64}px;
  padding: ${({$compact:e})=>e?`0 ${r.cardPadding-r.inlineGap}px`:`${r.textActionGap}px ${r.cardPadding-r.inlineGap}px`};
  border-radius: ${Se.control}px;
  cursor: pointer;
  background: ${({$open:e})=>e?d("color-fill-selected"):"transparent"};
  &:hover { background: ${({$open:e})=>e?d("color-fill-selected"):d("color-fill-hover")}; }
  &:focus-visible { outline: 2px solid ${d("color-focus")}; outline-offset: -2px; }
  & .nc-dot { width: 8px; height: 8px; border-radius: 50%; align-self: ${({$compact:e})=>e?"center":"start"}; margin-top: ${({$compact:e})=>e?0:ze}px; }
  & .nc-dot[data-unread] { background: ${d("color-action-text")}; }
  & .nc-main { display: grid; min-width: 0; }
  & .nc-title { font-size: 14px; line-height: 20px; font-weight: 600; color: ${d("color-text-primary")}; overflow-wrap: anywhere; }
  & .nc-title[data-read] { font-weight: 400; }
  & .nc-text { font-size: 14px; line-height: 20px; color: ${d("color-text-secondary")}; overflow-wrap: anywhere; }
  & .nc-time { font-size: 13px; line-height: 20px; color: ${d("color-text-secondary")}; font-variant-numeric: tabular-nums; white-space: nowrap; }
`,Je=m.p`
  margin: ${r.textActionGap}px ${r.cardPadding}px 0;
  display: flex;
  align-items: center;
  gap: ${r.textActionGap}px;
  font-size: 12px;
  line-height: 16px;
  color: ${d("color-text-secondary")};
  &::before, &::after { content: ''; flex: 1 1 auto; height: 1px; background: ${d("color-border-subtle")}; }
`,Qe=m.div`
  flex: none;
  display: flex;
  min-height: 0;
  @media (max-width: ${Be-1}px) {
    position: absolute;
    z-index: ${je.sticky+2};
    top: 0;
    right: 0;
    bottom: 0;
    width: 480px;
    & > aside { box-shadow: ${d("shadow-panel")}; }
  }
  @media (max-width: 1279px) { width: 440px; }
`,Ve=m.div`
  display: grid;
  gap: ${r.formRowGap}px;
  & > p { margin: 0; font-size: 14px; line-height: 22px; color: ${d("color-text-primary")}; }
  & > .nc-way { justify-self: start; }
`,Ze=m.span`
  display: inline-flex;
  align-items: center;
  gap: ${r.inlineGap}px;
  & [data-brand-part='demo-chip'] { font-style: normal; }
`;function Xe({list:e,compact:a,openedId:o,onOpen:n,priority:s}){const c=Ee(e,s),x=c??Le(e,O);return t.jsx(t.Fragment,{children:x.map(p=>t.jsxs(Ke,{"aria-labelledby":`nc-${p.key}`,"data-testid":`nc-group-${p.key}`,children:[t.jsx("h2",{id:`nc-${p.key}`,children:p.key==="priority"?`${J.priority} · ${Oe(s.days)}`:J[p.key]}),t.jsx("ul",{children:p.items.map(l=>t.jsx("li",{children:t.jsxs(Ye,{type:"button",$compact:a,$open:l.id===o,onClick:()=>n(l.id),"aria-label":`Open notification ${l.title}`,"aria-current":l.id===o||void 0,"data-testid":`nc-row-${l.id}`,"data-unread":!l.read||void 0,children:[t.jsx("span",{className:"nc-dot","data-unread":!l.read||void 0,"aria-hidden":!0}),t.jsxs("span",{className:"nc-main",children:[t.jsxs("span",{className:"nc-title","data-read":l.read||void 0,children:[l.title,!l.read&&t.jsx(Ae,{children:" (unread)"})]}),!a&&t.jsx("span",{className:"nc-text",children:l.text})]}),t.jsx("span",{className:"nc-time",children:De(l.createdAt,O,!c)})]})},l.id))})]},p.key))})}function He({list:e,compact:a,view:o,narrowed:n,openedId:s,onOpen:c,onClear:x,priority:p}){return Ne().loading?t.jsx(be,{rows:6,testId:"nc-loading"}):e.length===0?t.jsx(ve,{compact:!0,title:o==="unread"&&!n?"No unread notifications":"No notifications found",body:n?"Try another word or filter.":void 0,action:n||o==="unread"?t.jsx(A,{onClick:x,"data-testid":"nc-clear",children:n?"Clear Filters":"Show All"}):void 0}):t.jsxs(t.Fragment,{children:[t.jsx(Xe,{list:e,compact:a,openedId:s,onOpen:c,priority:p}),t.jsx(Je,{"data-testid":"nc-end",children:Me(e.length)})]})}function ot(){const e=le(),a=de(),[o,n]=ce(),s=j(i=>i.world.fleets),c=j(i=>i.fleetId),x=j(i=>i.setFleet),p=j(i=>i.world.shifts),l=N(i=>i.list),g=h.useMemo(()=>Ge(l,p),[l,p]),Z=N(i=>i.markRead),X=N(i=>i.markAllRead),[y,R]=h.useState("all"),[w,G]=h.useState(""),[$,P]=h.useState("all"),[b,E]=h.useState("all"),[L,H]=h.useState(!1),[D,T]=h.useState(),v=h.useMemo(()=>s.map(i=>i.id),[s]),F=_(i=>i.profile.notificationOrder),M=_(i=>i.profile.priorityWindowDays),C=h.useMemo(()=>({order:F,days:M,now:`${O}T${pe}`}),[F,M]),ee=h.useMemo(()=>Pe(q(g,{view:y,query:w,category:$,fleetId:b,fleetIds:v}),C),[g,y,w,$,b,v,C]),I=h.useMemo(()=>q(g,{view:"all",query:"",category:"all",fleetId:"all",fleetIds:v}),[g,v]),f=D?I.find(i=>i.id===D):void 0,z=I.filter(i=>!i.read),B=i=>{T(i),Z(i)};h.useEffect(()=>{const i=o.get("message");if(!i)return;I.some(oe=>oe.id===i)?B(i):a.warn("Notification not found. It may have been removed or is hidden by the current filter.",{key:"nc-missing"});const u=new URLSearchParams(o);u.delete("message"),n(u,{replace:!0})},[]);const te=()=>{const i=X(z.map(u=>u.id));a.done("All notifications marked as read",{undo:i,key:"nc-read-all"})},ae=i=>{i.fleetId!==c&&s.some(u=>u.id===i.fleetId)&&x(i.fleetId),e(i.link.to)},ie=w.trim()!==""||$!=="all"||b!=="all",ne=()=>{R("all"),G(""),P("all"),E("all")};return t.jsx(Ie,{eyebrow:"Settings",title:t.jsxs(Ze,{children:[t.jsx(we,{id:"nc:center",n:1,at:"right",children:"Notifications"})," ",t.jsx($e,{})]}),line:"Messages for the Fleets you can see.",wide:!0,testId:"notification-center",action:t.jsxs(t.Fragment,{children:[z.length>0&&t.jsx(A,{icon:t.jsx(ge,{}),onClick:te,"data-testid":"nc-mark-all-read",children:"Mark All Read"}),t.jsx(A,{icon:t.jsx(ye,{}),onClick:()=>e("/settings/notifications"),"data-testid":"nc-open-settings",children:"Open In Settings"})]}),children:t.jsxs(_e,{children:[t.jsxs(Ue,{"data-testid":"nc-list",children:[t.jsxs(We,{role:"toolbar","aria-label":"Notifications","data-testid":"nc-toolbar",children:[t.jsx(fe,{label:"Show",size:"md",value:y,onChange:R,options:[{value:"all",label:"All",testId:"nc-view-all"},{value:"unread",label:"Unread",testId:"nc-view-unread"}],"data-testid":"nc-view"}),t.jsx(he,{value:w,onChange:G,placeholder:"Search notifications",testId:"nc-search"}),t.jsx(U,{"aria-label":"Category",value:$,onChange:P,"data-testid":"nc-category",options:[{value:"all",label:"All categories"},...Re.map(i=>({value:i,label:W[i]}))]}),t.jsx(U,{"aria-label":"Fleet",value:b,onChange:E,"data-testid":"nc-fleet",options:[{value:"all",label:"All Fleets"},...s.map(i=>({value:i.id,label:i.name}))]}),t.jsx(me,{checked:L,onChange:H,testId:"nc-compact",children:"Compact"})]}),t.jsx(qe,{"data-testid":"nc-scroll",children:t.jsx(He,{list:ee,compact:L,view:y,narrowed:ie,openedId:f==null?void 0:f.id,onOpen:B,onClear:ne,priority:C})})]}),f&&t.jsx(Qe,{"data-testid":"nc-panel-spot",children:t.jsx(xe,{open:!0,onClose:()=>T(void 0),eyebrow:"Notification",title:f.title,testId:"nc-panel",children:t.jsxs(Ve,{children:[t.jsx("p",{"data-testid":"nc-panel-text",children:f.text}),t.jsx(ue,{columns:1,items:[{label:"Category",value:W[f.category]},...Fe(f)?[{label:"Reference",value:f.reference}]:[],{label:"Created",value:Te(f.createdAt)}]}),t.jsx(A,{size:"small",className:"nc-way",onClick:()=>ae(f),"data-testid":"nc-panel-open",children:`Open In ${f.link.page}`})]})})})]})})}export{ot as NotificationCenterPage};
