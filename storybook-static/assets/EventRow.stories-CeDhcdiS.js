import{j as p}from"./jsx-runtime-D_zvdyIk.js";import{E as K}from"./EventRow-2ufClljE.js";import"./index-YHEJibdA.js";import"./createLucideIcon-B5oPKDXb.js";import"./iframe-d2sodY_R.js";import"./preload-helper-Dp1pzeXC.js";import"./JsonHighlight-q1P6TuIy.js";import"./proxy-oLp51Ffe.js";import"./clock-DWTjRa6l.js";import"./filter-iGNtTwyB.js";import"./index-pUis7lPG.js";const e={id:"event-1",timestamp:Date.now(),event:"page_view",data:{page_title:"Home Page",page_location:"https://example.com/",page_referrer:"https://google.com/"},source:"dataLayer",raw:{},dataLayerIndex:0},O={id:"event-2",timestamp:Date.now(),event:"gtm.js",data:{"gtm.start":1234567890},source:"dataLayer",raw:{},dataLayerIndex:1},z={id:"event-3",timestamp:Date.now(),event:"purchase",data:{transaction_id:"T12345",value:99.99,currency:"USD",items:[{item_id:"SKU001",item_name:"Product 1",price:49.99,quantity:2}]},source:"dataLayer",raw:{},dataLayerIndex:2},B={id:"event-4",timestamp:Date.now()-6e4,event:"page_view",data:{page_title:"Previous Page"},source:"dataLayer (persisted)",raw:{},dataLayerIndex:0},ae={title:"Molecules/EventRow",component:K,parameters:{layout:"padded"},tags:["autodocs"],argTypes:{event:{control:"object"},isExpanded:{control:"boolean"},isCopied:{control:"boolean"},isNew:{control:"boolean"},showFilterMenu:{control:"boolean"},compact:{control:"boolean"},showTimestamps:{control:"boolean"},sourceColor:{control:"color"},onToggle:{action:"toggle"},onCopy:{action:"copy"},onAddFilterInclude:{action:"addFilterInclude"},onAddFilterExclude:{action:"addFilterExclude"},onToggleFilterMenu:{action:"toggleFilterMenu"}},decorators:[H=>p.jsx("div",{style:{backgroundColor:"#0f172a",borderRadius:"8px"},children:p.jsx(H,{})})]},s={args:{event:e,isExpanded:!1,showTimestamps:!0,sourceColor:"#6366f1"}},o={args:{event:e,isExpanded:!0,showTimestamps:!0,sourceColor:"#6366f1"}},r={args:{event:O,isExpanded:!1,showTimestamps:!0,sourceColor:"#22d3ee"}},a={args:{event:z,isExpanded:!0,showTimestamps:!0,sourceColor:"#10b981"}},t={args:{event:e,isExpanded:!1,isNew:!0,showTimestamps:!0,sourceColor:"#6366f1"}},n={args:{event:e,isExpanded:!1,isCopied:!0,showTimestamps:!0,sourceColor:"#6366f1"}},c={args:{event:e,isExpanded:!1,compact:!0,showTimestamps:!0,sourceColor:"#6366f1"}},m={args:{event:e,isExpanded:!1,showTimestamps:!1,sourceColor:"#6366f1"}},d={args:{event:B,isExpanded:!1,showTimestamps:!0,sourceColor:"#f59e0b"}},i={args:{event:e,isExpanded:!1,showFilterMenu:!0,showTimestamps:!0,sourceColor:"#6366f1"}};var u,l,v;s.parameters={...s.parameters,docs:{...(u=s.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    event: mockEvent,
    isExpanded: false,
    showTimestamps: true,
    sourceColor: '#6366f1'
  }
}`,...(v=(l=s.parameters)==null?void 0:l.docs)==null?void 0:v.source}}};var g,E,w;o.parameters={...o.parameters,docs:{...(g=o.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    event: mockEvent,
    isExpanded: true,
    showTimestamps: true,
    sourceColor: '#6366f1'
  }
}`,...(w=(E=o.parameters)==null?void 0:E.docs)==null?void 0:w.source}}};var f,x,h;r.parameters={...r.parameters,docs:{...(f=r.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    event: mockGTMEvent,
    isExpanded: false,
    showTimestamps: true,
    sourceColor: '#22d3ee'
  }
}`,...(h=(x=r.parameters)==null?void 0:x.docs)==null?void 0:h.source}}};var C,T,k;a.parameters={...a.parameters,docs:{...(C=a.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    event: mockPurchaseEvent,
    isExpanded: true,
    showTimestamps: true,
    sourceColor: '#10b981'
  }
}`,...(k=(T=a.parameters)==null?void 0:T.docs)==null?void 0:k.source}}};var y,M,b;t.parameters={...t.parameters,docs:{...(y=t.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    event: mockEvent,
    isExpanded: false,
    isNew: true,
    showTimestamps: true,
    sourceColor: '#6366f1'
  }
}`,...(b=(M=t.parameters)==null?void 0:M.docs)==null?void 0:b.source}}};var P,S,F;n.parameters={...n.parameters,docs:{...(P=n.parameters)==null?void 0:P.docs,source:{originalSource:`{
  args: {
    event: mockEvent,
    isExpanded: false,
    isCopied: true,
    showTimestamps: true,
    sourceColor: '#6366f1'
  }
}`,...(F=(S=n.parameters)==null?void 0:S.docs)==null?void 0:F.source}}};var _,L,j;c.parameters={...c.parameters,docs:{...(_=c.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    event: mockEvent,
    isExpanded: false,
    compact: true,
    showTimestamps: true,
    sourceColor: '#6366f1'
  }
}`,...(j=(L=c.parameters)==null?void 0:L.docs)==null?void 0:j.source}}};var I,D,N;m.parameters={...m.parameters,docs:{...(I=m.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    event: mockEvent,
    isExpanded: false,
    showTimestamps: false,
    sourceColor: '#6366f1'
  }
}`,...(N=(D=m.parameters)==null?void 0:D.docs)==null?void 0:N.source}}};var G,R,W;d.parameters={...d.parameters,docs:{...(G=d.parameters)==null?void 0:G.docs,source:{originalSource:`{
  args: {
    event: mockPersistedEvent,
    isExpanded: false,
    showTimestamps: true,
    sourceColor: '#f59e0b'
  }
}`,...(W=(R=d.parameters)==null?void 0:R.docs)==null?void 0:W.source}}};var A,U,q;i.parameters={...i.parameters,docs:{...(A=i.parameters)==null?void 0:A.docs,source:{originalSource:`{
  args: {
    event: mockEvent,
    isExpanded: false,
    showFilterMenu: true,
    showTimestamps: true,
    sourceColor: '#6366f1'
  }
}`,...(q=(U=i.parameters)==null?void 0:U.docs)==null?void 0:q.source}}};const te=["Collapsed","Expanded","GTMEvent","PurchaseEvent","NewEvent","Copied","CompactMode","WithoutTimestamps","PersistedEvent","WithFilterMenu"];export{s as Collapsed,c as CompactMode,n as Copied,o as Expanded,r as GTMEvent,t as NewEvent,d as PersistedEvent,a as PurchaseEvent,i as WithFilterMenu,m as WithoutTimestamps,te as __namedExportsOrder,ae as default};
