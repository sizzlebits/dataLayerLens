import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{c as t}from"./createLucideIcon-B5oPKDXb.js";import{A as c}from"./index-pUis7lPG.js";import{m}from"./proxy-oLp51Ffe.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=t("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=t("CircleCheckBig",[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=t("CircleX",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=t("Info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]),f={success:{bgClass:"bg-dl-success/90",Icon:d},error:{bgClass:"bg-dl-error/90",Icon:u},warning:{bgClass:"bg-dl-warning/90",Icon:p},info:{bgClass:"bg-dl-primary/90",Icon:y}};function g({message:a,type:o="error",position:r="bottom"}){const i=f[o],l=i.Icon,s=r==="top"?"top-4":"bottom-4",n=r==="top"?-50:50;return e.jsx(c,{children:a&&e.jsxs(m.div,{initial:{opacity:0,y:n},animate:{opacity:1,y:0},exit:{opacity:0,y:n},className:`fixed ${s} left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 ${i.bgClass} text-white text-sm rounded-lg shadow-lg z-50`,role:"alert","aria-live":"polite",children:[e.jsx(l,{className:"w-4 h-4 flex-shrink-0","aria-hidden":"true"}),e.jsx("span",{children:a})]})})}g.__docgenInfo={description:"",methods:[],displayName:"Toast",props:{message:{required:!0,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:""},type:{required:!1,tsType:{name:"union",raw:"'success' | 'error' | 'info' | 'warning'",elements:[{name:"literal",value:"'success'"},{name:"literal",value:"'error'"},{name:"literal",value:"'info'"},{name:"literal",value:"'warning'"}]},description:"",defaultValue:{value:"'error'",computed:!1}},position:{required:!1,tsType:{name:"union",raw:"'top' | 'bottom'",elements:[{name:"literal",value:"'top'"},{name:"literal",value:"'bottom'"}]},description:"",defaultValue:{value:"'bottom'",computed:!1}}}};export{g as T};
