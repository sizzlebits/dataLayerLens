import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{r as N}from"./iframe-d2sodY_R.js";import{S as r}from"./index-YHEJibdA.js";import{C as w}from"./ColorSwatch-B6zHs2xM.js";import{m as d}from"./proxy-oLp51Ffe.js";import{C as k}from"./chevron-down-BNRKPvBn.js";import{A as P}from"./index-pUis7lPG.js";import"./preload-helper-Dp1pzeXC.js";import"./createLucideIcon-B5oPKDXb.js";function f({sources:s,sourceColors:j,onColorChange:E}){const[b,l]=N.useState(null);return s.length===0?e.jsxs("div",{className:"text-sm text-slate-500 text-center py-4",children:["No dataLayer sources detected yet.",e.jsx("br",{}),e.jsx("span",{className:"text-xs",children:"Sources will appear as events are captured."})]}):e.jsx("div",{className:"space-y-1",children:s.map(a=>{const u=j[a]||r[0],i=b===a;return e.jsxs("div",{className:"bg-dl-dark rounded-lg border border-dl-border",children:[e.jsxs(d.button,{onClick:()=>l(i?null:a),className:"w-full flex items-center gap-3 p-3 hover:bg-dl-card/50 transition-colors",children:[e.jsx("div",{className:"w-4 h-4 rounded-full flex-shrink-0 border border-white/20",style:{backgroundColor:u}}),e.jsx("span",{className:"flex-1 text-left text-sm font-mono text-white truncate",children:a}),e.jsx(d.div,{animate:{rotate:i?180:0},transition:{duration:.2},children:e.jsx(k,{className:"w-4 h-4 text-slate-400"})})]}),e.jsx(P,{children:i&&e.jsx(d.div,{initial:{height:0,opacity:0},animate:{height:"auto",opacity:1},exit:{height:0,opacity:0},transition:{duration:.2},className:"overflow-hidden",children:e.jsx("div",{className:"border-t border-dl-border",children:e.jsx(w,{colors:r,selectedColor:u,onSelect:v=>{E(a,v),l(null)}})})})})]},a)})})}f.__docgenInfo={description:"",methods:[],displayName:"SourceColorEditor",props:{sources:{required:!0,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:""},sourceColors:{required:!0,tsType:{name:"Record",elements:[{name:"string"},{name:"string"}],raw:"Record<string, string>"},description:""},onColorChange:{required:!0,tsType:{name:"signature",type:"function",raw:"(source: string, color: string) => void",signature:{arguments:[{type:{name:"string"},name:"source"},{type:{name:"string"},name:"color"}],return:{name:"void"}}},description:""}}};const F={title:"Molecules/SourceColorEditor",component:f,parameters:{layout:"padded"},tags:["autodocs"],argTypes:{sources:{control:"object"},sourceColors:{control:"object"},onColorChange:{action:"colorChanged"}},decorators:[s=>e.jsx("div",{style:{width:"300px"},children:e.jsx(s,{})})]},o={args:{sources:["dataLayer"],sourceColors:{dataLayer:r[0]}}},t={args:{sources:["dataLayer","customLayer","analyticsLayer"],sourceColors:{dataLayer:r[0],customLayer:r[1],analyticsLayer:r[2]}}},n={args:{sources:[],sourceColors:{}}},c={args:{sources:["dataLayer","customLayer","analyticsLayer","marketingLayer","trackingLayer"],sourceColors:{dataLayer:r[0],customLayer:r[1],analyticsLayer:r[2],marketingLayer:r[3],trackingLayer:r[4]}}};var m,p,y;o.parameters={...o.parameters,docs:{...(m=o.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    sources: ['dataLayer'],
    sourceColors: {
      dataLayer: SOURCE_COLOR_POOL[0]
    }
  }
}`,...(y=(p=o.parameters)==null?void 0:p.docs)==null?void 0:y.source}}};var L,O,g;t.parameters={...t.parameters,docs:{...(L=t.parameters)==null?void 0:L.docs,source:{originalSource:`{
  args: {
    sources: ['dataLayer', 'customLayer', 'analyticsLayer'],
    sourceColors: {
      dataLayer: SOURCE_COLOR_POOL[0],
      customLayer: SOURCE_COLOR_POOL[1],
      analyticsLayer: SOURCE_COLOR_POOL[2]
    }
  }
}`,...(g=(O=t.parameters)==null?void 0:O.docs)==null?void 0:g.source}}};var C,x,S;n.parameters={...n.parameters,docs:{...(C=n.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    sources: [],
    sourceColors: {}
  }
}`,...(S=(x=n.parameters)==null?void 0:x.docs)==null?void 0:S.source}}};var h,_,R;c.parameters={...c.parameters,docs:{...(h=c.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    sources: ['dataLayer', 'customLayer', 'analyticsLayer', 'marketingLayer', 'trackingLayer'],
    sourceColors: {
      dataLayer: SOURCE_COLOR_POOL[0],
      customLayer: SOURCE_COLOR_POOL[1],
      analyticsLayer: SOURCE_COLOR_POOL[2],
      marketingLayer: SOURCE_COLOR_POOL[3],
      trackingLayer: SOURCE_COLOR_POOL[4]
    }
  }
}`,...(R=(_=c.parameters)==null?void 0:_.docs)==null?void 0:R.source}}};const G=["SingleSource","MultipleSources","NoSources","ManySources"];export{c as ManySources,t as MultipleSources,n as NoSources,o as SingleSource,G as __namedExportsOrder,F as default};
