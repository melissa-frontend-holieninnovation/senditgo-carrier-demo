import{aj as $,cx as j,r as g,j as e,cy as H,bl as N,c2 as S,q as C,b5 as Z,eq as E,er as K,J as b,K as f,l as v,bh as M,cC as G,cS as U,a8 as R,m as L,ab as y,es as J,et as V,d1 as Q,dD as X,dE as A,cF as Y,bq as ee}from"./index-BhVFf3gK.js";import{S as w,k as te,a as se}from"./SettingsSection-jcCeJX5Y.js";import{x as z,y as T,z as ie,A as ne,B as ae,R as D,q as P,C as oe,s as re}from"./settingsModel-fz3wibD6.js";import{A as le}from"./PictureField-C8T05Otn.js";import{T as B}from"./index-VdKVkp4Q.js";import{a as de}from"./FuelPricesSection-B58HFiOq.js";import"./room-CPKN1nU0.js";import"./CopyOutlined-CTJdL1v4.js";const ce=v.div`
  display: grid;
  gap: ${b.inlineGap}px;
  min-width: 0;
  & .fs-label { font-size: 13px; line-height: 18px; font-weight: 600; color: ${f("color-text-secondary")}; }
  & .fs-add { display: flex; align-items: flex-start; gap: ${b.inlineGap}px; max-width: 480px; }
  & .fs-add > :first-child { flex: 1 1 auto; min-width: 0; }
  & .fs-add > button { flex: none; }
  & .fs-empty { margin: 0; font-size: 14px; line-height: 22px; color: ${f("color-text-primary")}; }
`,he=t=>t?`${E(t)} (${t})`:`Not set. Times show in ${E(K)}.`;function pe({fleet:t,editable:r}){const p=$(),l=j(c=>c.patchFleet),s=j(c=>c.setDirty),[i,o]=g.useState(t.name),[n,m]=g.useState(t.deliveryCities),[d,x]=g.useState(""),[a,u]=g.useState({}),k=()=>{o(t.name),m(t.deliveryCities),x(""),u({})},I=()=>{const c=ie(d,n);u(h=>({...h,city:c??void 0})),!c&&(m([...n,d.trim()]),x(""),s(!0))},_=()=>{const c=z(i)??void 0;if(u({name:c}),c)return!1;const h=T(t,{name:i.trim(),deliveryCities:n}),F=h.name!==t.name,q=l(t.id,{name:h.name,deliveryCities:h.deliveryCities});return p.done(`${F?"Fleet name and cities":"Cities"} saved · ${h.name}`,{undo:q}),!0};return e.jsx(w,{id:"fleet-about",title:"About this Fleet",lead:"What this Fleet is called, where it works and the cities it delivers to.",note:r?void 0:le,editable:r,onBeginEdit:k,onSave:_,other:{record:t.name,stored:{name:t.name,deliveryCities:t.deliveryCities},write:()=>{const c=j.getState().fleets.find(h=>h.id===t.id);c&&!c.deliveryCities.includes("Blacktown")&&l(c.id,{deliveryCities:[...c.deliveryCities,"Blacktown"]})},adjust:c=>{const h=te({name:i,deliveryCities:n},c,{name:t.name,deliveryCities:t.deliveryCities});o(h.name),m(h.deliveryCities)},refresh:()=>{o(t.name),m(t.deliveryCities),x(""),u({})}},children:c=>e.jsxs(e.Fragment,{children:[e.jsxs(H,{columns:3,minCol:200,children:[c&&e.jsx(N,{label:"Fleet name",helper:"Shown in the Fleet selector and on Run Sheets.",value:i,maxLength:50,onChange:h=>{o(h),s(!0)},error:a.name,validate:h=>z(h)??void 0,testId:"fleet-name"}),e.jsx(S,{label:"Fleet code",value:t.code,note:"Set when the Fleet was created. It can't change.",testId:"fleet-code"}),e.jsx(S,{label:"Based in",value:t.basedIn,note:"Set up by SenditGo support.",testId:"fleet-based-in"}),e.jsx(S,{label:"Time zone",value:he(t.timeZone),note:t.timeZone?"Every time for this Fleet shows in this zone.":void 0,testId:"fleet-zone"})]}),e.jsx(ce,{"data-testid":"fleet-cities",children:c?e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"fs-label",id:"fleet-city-label",children:"Cities this Fleet delivers to"}),e.jsxs("div",{className:"fs-add",children:[e.jsx(N,{ariaLabel:"City to add",helper:"Add one city at a time.",value:d,maxLength:50,onChange:h=>{x(h),u(F=>({...F,city:void 0}))},error:a.city,testId:"fleet-city-input"}),e.jsx(C,{icon:e.jsx(Z,{}),onClick:I,"data-testid":"fleet-city-add",children:"Add City"})]}),n.length===0?e.jsx("p",{className:"fs-empty","data-testid":"fleet-cities-none",children:"No cities yet."}):e.jsx(B,{items:n,label:"Cities this Fleet delivers to",testId:"fleet-city",onRemove:h=>{m(n.filter(F=>F!==h)),s(!0)}})]}):e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"fs-label",children:"Cities this Fleet delivers to"}),t.deliveryCities.length===0?e.jsx("p",{className:"fs-empty",tabIndex:0,"data-testid":"fleet-cities-none",children:"No cities yet."}):e.jsx(B,{items:t.deliveryCities,label:"Cities this Fleet delivers to",testId:"fleet-city"})]})})]})})}const me=[{value:"commission",title:"Package Commission Rate"},{value:"perDriverDay",title:"Per driver per day"}],fe=v.p`
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: ${f("color-text-primary")};
`,ue=v.div`
  display: grid;
  gap: ${b.formRowGap}px;
`;function xe({fleet:t,onClose:r}){const p=$(),l=j(a=>a.setFleetLoan),[s,i]=g.useState(""),[o,n]=g.useState("commission"),[m,d]=g.useState(),x=()=>{const a=ne(s);d(a??void 0),!a&&(l(t.id,{companyCode:s.trim(),feeType:o}),p.done(`${t.name} is on loan.`,{key:"fleet-loan"}),r())};return e.jsx(G,{open:!0,size:"md",title:`Loan ${t.name} to another team?`,onRequestClose:r,dismiss:{label:"Back",onClick:r,testId:"fleet-loan-back"},primary:{label:"Loan Fleet",onClick:x,testId:"fleet-loan-confirm"},"data-testid":"fleet-loan-dialog",children:e.jsxs(ue,{children:[e.jsx(N,{label:"Company code",value:s,maxLength:36,autoFocus:!0,helper:"The code of the company that takes this Fleet.",onChange:a=>{i(a),d(void 0)},error:m,testId:"fleet-loan-code"}),e.jsx(U,{label:"Platform fee type",children:e.jsx(R,{label:"Platform fee type",value:o,onChange:n,options:me,columns:2,testId:"fleet-loan-fee"})})]})})}function ye({fleet:t,onClose:r}){const p=$(),l=j(i=>i.setFleetLoan),s=()=>{l(t.id,null),p.done(`${t.name} recovered.`,{key:"fleet-loan"}),r()};return e.jsx(G,{open:!0,size:"sm",title:`Recover ${t.name}?`,onRequestClose:r,dismiss:{label:"Keep Loan",onClick:r,testId:"fleet-recover-keep"},primary:{label:"Recover Fleet",onClick:s,testId:"fleet-recover-confirm"},"data-testid":"fleet-recover-dialog"})}function ge({fleet:t,editable:r}){const[p,l]=g.useState(null),s=!!t.loan,i=r?s?e.jsx(C,{onClick:()=>l("recover"),"data-testid":"fleet-recover",children:"Recover Fleet"}):e.jsx(C,{onClick:()=>l("loan"),"data-testid":"fleet-loan",children:"Loan Fleet"}):void 0;return e.jsxs(e.Fragment,{children:[e.jsx(w,{id:"fleet-loan",review:{id:"st:fleet-loan",n:5},title:"Fleet loan",titleAfter:e.jsx(M,{}),lead:"Lend this Fleet to another team for a while.",action:i,children:e.jsx(fe,{"data-testid":"fleet-loan-state",children:s?"This Fleet is on loan.":"Not on loan."})}),p==="loan"&&e.jsx(xe,{fleet:t,onClose:()=>l(null)}),p==="recover"&&e.jsx(ye,{fleet:t,onClose:()=>l(null)})]})}const O=[{value:"ours",title:"Only our company's Orders",line:"Orders your company creates."},{value:"partners",title:"Also Orders from partners",line:"Orders other companies send you, as well as your own."}];function ve({fleet:t,editable:r}){const p=$(),l=j(o=>o.patchFleet),s=t.companyOnly?"ours":"partners",i=o=>{if(o===s)return;const n=T(t,{companyOnly:o==="ours"}),m=l(t.id,{companyOnly:n.companyOnly});p.done(o==="partners"?`${t.name} now takes Orders from partners too · Fleet Setup`:`${t.name} now takes only your company's Orders · Fleet Setup`,{undo:m})};return e.jsx(w,{id:"fleet-orders",review:{id:"st:fleet-orders",n:1},title:"Orders this Fleet takes",lead:"Which Orders can reach this Fleet's Pending Orders.",children:r?e.jsx(R,{label:"Orders this Fleet takes",columns:2,value:s,onChange:i,options:O,testId:"fleet-orders-choice"}):e.jsx(S,{label:"Takes",value:O.find(o=>o.value===s).title,note:O.find(o=>o.value===s).line,testId:"fleet-orders-read"})})}const je=v.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${b.inlineGap}px;
  & li { display: grid; min-width: 0; }
  & .fs-line { font-size: 14px; line-height: 20px; color: ${f("color-text-primary")}; }
  & .fs-line b { font-weight: 600; }
  & .fs-who { font-size: 12px; line-height: 18px; color: ${f("color-text-secondary")}; }
`,be=v.p`
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: ${f("color-text-secondary")};
`;function we({fleetId:t}){const r=L(),p=y(a=>a.role),l=y(a=>a.world.shifts),s=y(a=>a.world.drivers),i=y(a=>a.world.fleets.some(u=>u.id===t)),o=y(a=>a.fleetId),n=y(a=>a.setFleet),m=ae(l,s,t),d=()=>{o!==t&&n(t),r("/roster")},x=i&&J(p).view?e.jsx(C,{size:"small",onClick:d,"data-testid":"fleet-shifts-open-roster",children:"Open In Roster"}):void 0;return e.jsx(w,{id:"fleet-shifts",review:{id:"st:fleet-shifts",n:4},title:"Shifts",lead:"Drivers get their Shifts on the Roster.",action:x,children:m.length===0?e.jsx(be,{"data-testid":"fleet-shifts-none",children:"No Shifts yet."}):e.jsx(je,{"aria-label":"Shifts of this Fleet","data-testid":"fleet-shifts",children:m.map(a=>{const[u,...k]=a.line.split(" · ");return e.jsxs("li",{"data-testid":`fleet-shift-${a.shiftId}`,children:[e.jsxs("span",{className:"fs-line",children:[e.jsx("b",{children:u}),k.map(I=>` · ${I}`).join("")]}),e.jsx("span",{className:"fs-who","data-testid":`fleet-shift-drivers-${a.shiftId}`,children:a.drivers})]},a.shiftId)})})})}const W=v.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  & li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: ${b.sectionGap}px;
    min-height: 44px;
    padding: ${b.stackTight}px 0;
    border-top: 1px solid ${f("color-border-subtle")};
  }
  & li:first-child { border-top: 0; }
  & .fw-name { font-size: 14px; line-height: 22px; font-weight: 600; color: ${f("color-text-primary")}; min-width: 0; }
  & .fw-closed { font-weight: 400; color: ${f("color-text-secondary")}; }
  & .fw-n { font-size: 14px; line-height: 22px; color: ${f("color-text-secondary")}; white-space: nowrap; }
  & .fw-n b { font-weight: 600; color: ${f("color-text-primary")}; font-variant-numeric: tabular-nums; }
  & .fw-empty { margin: 0; font-size: 14px; line-height: 22px; color: ${f("color-text-primary")}; }
`;function Fe({fleetId:t,data:r}){const p=L(),l=V(t,r);return e.jsx(w,{id:"fleet-warehouses",title:"Warehouses",lead:"Where this Fleet's drivers start. Set up by SenditGo support.",children:l.length===0?e.jsx(W,{as:"div",children:e.jsx("p",{className:"fw-empty",children:"No Warehouses yet. SenditGo support links Fleets to Warehouses."})}):e.jsx(W,{"aria-label":"Warehouses this Fleet uses","data-testid":"fleet-warehouses",children:l.map(({warehouse:s,driversStarting:i})=>e.jsxs("li",{"data-testid":`fleet-warehouse-${s.id}`,children:[e.jsxs("span",{className:"fw-name",children:[s.name,s.blocked&&e.jsx("span",{className:"fw-closed",children:" · Closed"})]}),e.jsxs("span",{className:"fw-n",children:["Drivers starting here ",e.jsx("b",{children:i})]}),e.jsx(C,{size:"small",onClick:()=>p(`/settings/warehouses/${s.id}`),"aria-label":`Open In Warehouses: ${s.name}`,"data-testid":`fleet-warehouse-open-${s.id}`,children:"Open In Warehouses"})]},s.id))})})}const Se=v.p`
  margin: 0;
  font-size: 13px;
  line-height: 18px;
  color: ${f("color-text-secondary")};
`;function Ce({fleet:t,editable:r}){const p=$(),l=j(i=>i.patchFleet),s=i=>{if(i===t.routeShare)return;const o=T(t,{routeShare:i}),n=l(t.id,{routeShare:o.routeShare});p.done(`${P(i)} from the next time runs are built`,{undo:n})};return e.jsxs(w,{id:"fleet-sharing",review:{id:"st:fleet-sharing",n:2},title:"How work is shared between drivers",lead:"How runs are shared out when they are built for this Fleet.",children:[r?e.jsx(R,{label:"How work is shared between drivers",columns:2,value:t.routeShare,onChange:s,options:D.map(i=>({value:i.value,title:i.title,line:i.line})),testId:"fleet-sharing-choice"}):e.jsx(S,{label:"Work is shared as",value:P(t.routeShare),note:D.find(i=>i.value===t.routeShare).line,testId:"fleet-sharing-read"}),e.jsx(Se,{"data-testid":"fleet-sharing-foot",children:oe})]})}const $e=v.label`
  display: inline-flex;
  align-items: center;
  gap: ${b.inlineGap}px;
  white-space: nowrap;
  & > span { font-size: 13px; line-height: 18px; font-weight: 600; color: ${f("color-text-secondary")}; }
  & .ant-select { width: 200px; }
  @media (max-width: 1279px) { & .ant-select { width: 160px; } }
`;function Ae(){const{fleetId:t}=Q(),r=L(),p=y(d=>d.role),l=y(d=>d.fleetId),s=X(),i=re(p),o=Number(t),n=Number.isInteger(o)?A(o,s):void 0;if(!n){const d=A(l,s)??s.fleets[0];return e.jsx(Y,{to:`/settings/fleets/${d.id}`,replace:!0})}const m=s.fleets.length>1?e.jsxs($e,{"data-testid":"fleet-picker",children:[e.jsx("span",{children:"Fleet"}),e.jsx(ee,{"aria-label":"Fleet",value:n.id,onChange:d=>r(`/settings/fleets/${d}`),options:s.fleets.map(d=>({value:d.id,label:d.name})),"data-testid":"fleet-picker-select"})]}):void 0;return e.jsxs(se,{eyebrow:"Settings",title:n.name,line:"How this Fleet takes Orders, shares work between drivers, and what fuel costs.",action:m,failId:"fleet-about",testId:"settings-fleet-setup",side:e.jsxs(e.Fragment,{children:[e.jsx(Fe,{fleetId:n.id,data:s}),e.jsx(we,{fleetId:n.id}),e.jsx(de,{fleet:n,editable:i.editFuel},`fuel-${n.id}`),e.jsx(ge,{fleet:n,editable:i.manageLoan})]}),children:[e.jsx(pe,{fleet:n,editable:i.editFleet},`about-${n.id}`),e.jsx(ve,{fleet:n,editable:i.fleetChoices}),e.jsx(Ce,{fleet:n,editable:i.fleetChoices})]},n.id)}export{Ae as FleetSetupPage};
