import{j as a}from"./jsx-runtime-D_zvdyIk.js";import{F as w}from"./FilterPanel-C6wOhIiR.js";import"./iframe-d2sodY_R.js";import"./preload-helper-Dp1pzeXC.js";import"./proxy-oLp51Ffe.js";import"./filter-iGNtTwyB.js";import"./createLucideIcon-B5oPKDXb.js";import"./index-pUis7lPG.js";import"./x-gYhyWlMT.js";import"./search-B462KUoz.js";import"./plus-BsDFT6l8.js";const C={title:"Molecules/FilterPanel",component:w,parameters:{layout:"padded"},tags:["autodocs"],argTypes:{filters:{control:"object"},filterMode:{control:"select",options:["include","exclude"]},onAddFilter:{action:"addFilter"},onRemoveFilter:{action:"removeFilter"},onClearFilters:{action:"clearFilters"},onSetFilterMode:{action:"setFilterMode"}},decorators:[j=>a.jsx("div",{style:{width:"350px"},children:a.jsx(j,{})})]},e={args:{filters:[],filterMode:"exclude"}},r={args:{filters:["gtm.js","gtm.dom","gtm.load"],filterMode:"exclude"}},t={args:{filters:["page_view","purchase","add_to_cart"],filterMode:"include"}},o={args:{filters:["page_view"],filterMode:"include"}},s={args:{filters:["gtm.js","gtm.dom","gtm.load","gtm.click","page_view","view_item","add_to_cart"],filterMode:"exclude"}};var i,l,c;e.parameters={...e.parameters,docs:{...(i=e.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    filters: [],
    filterMode: 'exclude'
  }
}`,...(c=(l=e.parameters)==null?void 0:l.docs)==null?void 0:c.source}}};var d,n,m;r.parameters={...r.parameters,docs:{...(d=r.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    filters: ['gtm.js', 'gtm.dom', 'gtm.load'],
    filterMode: 'exclude'
  }
}`,...(m=(n=r.parameters)==null?void 0:n.docs)==null?void 0:m.source}}};var p,g,u;t.parameters={...t.parameters,docs:{...(p=t.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    filters: ['page_view', 'purchase', 'add_to_cart'],
    filterMode: 'include'
  }
}`,...(u=(g=t.parameters)==null?void 0:g.docs)==null?void 0:u.source}}};var f,F,_;o.parameters={...o.parameters,docs:{...(f=o.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    filters: ['page_view'],
    filterMode: 'include'
  }
}`,...(_=(F=o.parameters)==null?void 0:F.docs)==null?void 0:_.source}}};var x,M,v;s.parameters={...s.parameters,docs:{...(x=s.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    filters: ['gtm.js', 'gtm.dom', 'gtm.load', 'gtm.click', 'page_view', 'view_item', 'add_to_cart'],
    filterMode: 'exclude'
  }
}`,...(v=(M=s.parameters)==null?void 0:M.docs)==null?void 0:v.source}}};const O=["Empty","WithExcludeFilters","WithIncludeFilters","SingleFilter","ManyFilters"];export{e as Empty,s as ManyFilters,o as SingleFilter,r as WithExcludeFilters,t as WithIncludeFilters,O as __namedExportsOrder,C as default};
