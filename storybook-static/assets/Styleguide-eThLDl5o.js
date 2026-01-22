import{j as n}from"./jsx-runtime-D_zvdyIk.js";import{useMDXComponents as l}from"./index-Dh-tPYZ3.js";import{M as r}from"./blocks-DsbFQBpZ.js";import"./iframe-d2sodY_R.js";import"./preload-helper-Dp1pzeXC.js";import"./index-CbpJdCXt.js";function i(s){const e={code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...l(),...s.components};return n.jsxs(n.Fragment,{children:[n.jsx(r,{title:"Docs/Styleguide"}),`
`,n.jsx(e.h1,{id:"style-guide",children:"Style Guide"}),`
`,n.jsx(e.p,{children:"This guide outlines the design patterns and conventions used in the DataLayer Lens component library."}),`
`,n.jsx(e.h2,{id:"component-patterns",children:"Component Patterns"}),`
`,n.jsx(e.h3,{id:"atomic-design-hierarchy",children:"Atomic Design Hierarchy"}),`
`,n.jsxs(e.ol,{children:[`
`,n.jsxs(e.li,{children:[`
`,n.jsxs(e.p,{children:[n.jsx(e.strong,{children:"Atoms"})," - Single-purpose, reusable building blocks"]}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsx(e.li,{children:"Examples: Toggle, SearchInput, Toast"}),`
`,n.jsx(e.li,{children:"Should be stateless where possible"}),`
`,n.jsx(e.li,{children:"Accept callbacks for user interactions"}),`
`]}),`
`]}),`
`,n.jsxs(e.li,{children:[`
`,n.jsxs(e.p,{children:[n.jsx(e.strong,{children:"Molecules"})," - Combinations of atoms that form functional units"]}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsx(e.li,{children:"Examples: FilterPanel, EventRow, EventStats"}),`
`,n.jsx(e.li,{children:"May contain local state for UI interactions"}),`
`,n.jsx(e.li,{children:"Compose multiple atoms together"}),`
`]}),`
`]}),`
`,n.jsxs(e.li,{children:[`
`,n.jsxs(e.p,{children:[n.jsx(e.strong,{children:"Organisms"})," - Complex components with significant functionality"]}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsx(e.li,{children:"Examples: EventPanel, SettingsDrawer"}),`
`,n.jsx(e.li,{children:"May manage substantial local state"}),`
`,n.jsx(e.li,{children:"Often connect to global state or APIs"}),`
`]}),`
`]}),`
`,n.jsxs(e.li,{children:[`
`,n.jsxs(e.p,{children:[n.jsx(e.strong,{children:"Views"})," - Full-page or panel layouts"]}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsx(e.li,{children:"Examples: DevToolsPanel, Popup"}),`
`,n.jsx(e.li,{children:"Orchestrate organisms and provide context"}),`
`,n.jsx(e.li,{children:"Handle routing and navigation"}),`
`]}),`
`]}),`
`]}),`
`,n.jsx(e.h2,{id:"animation-guidelines",children:"Animation Guidelines"}),`
`,n.jsx(e.p,{children:"All animations use Framer Motion with consistent timing:"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-typescript",children:`// Standard spring animation
transition={{ type: 'spring', stiffness: 500, damping: 30 }}

// Fade in/out
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}

// Slide animations
initial={{ x: '100%' }}
animate={{ x: 0 }}
exit={{ x: '100%' }}
`})}),`
`,n.jsx(e.h3,{id:"hover-effects",children:"Hover Effects"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:["Use ",n.jsx(e.code,{children:"whileHover={{ scale: 1.05 }}"})," for subtle emphasis"]}),`
`,n.jsxs(e.li,{children:["Use ",n.jsx(e.code,{children:"whileTap={{ scale: 0.95 }}"})," for tactile feedback"]}),`
`]}),`
`,n.jsx(e.h2,{id:"accessibility-standards",children:"Accessibility Standards"}),`
`,n.jsx(e.p,{children:"All components follow WCAG 2.1 AA guidelines:"}),`
`,n.jsx(e.h3,{id:"interactive-elements",children:"Interactive Elements"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:["All buttons have ",n.jsx(e.code,{children:"aria-label"})," when icon-only"]}),`
`,n.jsxs(e.li,{children:["Toggles use ",n.jsx(e.code,{children:'role="switch"'})," with ",n.jsx(e.code,{children:"aria-checked"})]}),`
`,n.jsxs(e.li,{children:["Expandable sections use ",n.jsx(e.code,{children:"aria-expanded"})]}),`
`]}),`
`,n.jsx(e.h3,{id:"keyboard-navigation",children:"Keyboard Navigation"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsx(e.li,{children:"All interactive elements are focusable"}),`
`,n.jsxs(e.li,{children:["Custom focus styles using ",n.jsx(e.code,{children:"focus-visible:ring-2"})]}),`
`,n.jsx(e.li,{children:"Escape key closes modals and dropdowns"}),`
`]}),`
`,n.jsx(e.h3,{id:"screen-readers",children:"Screen Readers"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:["Icons include ",n.jsx(e.code,{children:'aria-hidden="true"'})]}),`
`,n.jsxs(e.li,{children:["Status changes announced with ",n.jsx(e.code,{children:'role="alert"'})]}),`
`,n.jsxs(e.li,{children:["Live regions use ",n.jsx(e.code,{children:'aria-live="polite"'})]}),`
`]}),`
`,n.jsx(e.h2,{id:"naming-conventions",children:"Naming Conventions"}),`
`,n.jsx(e.h3,{id:"components",children:"Components"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:["PascalCase for component names: ",n.jsx(e.code,{children:"EventPanel"}),", ",n.jsx(e.code,{children:"SearchInput"})]}),`
`,n.jsx(e.li,{children:"Descriptive, action-oriented names"}),`
`]}),`
`,n.jsx(e.h3,{id:"props",children:"Props"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:["camelCase for prop names: ",n.jsx(e.code,{children:"isExpanded"}),", ",n.jsx(e.code,{children:"onToggle"})]}),`
`,n.jsxs(e.li,{children:["Boolean props prefixed with ",n.jsx(e.code,{children:"is"}),", ",n.jsx(e.code,{children:"has"}),", ",n.jsx(e.code,{children:"show"}),", ",n.jsx(e.code,{children:"can"})]}),`
`,n.jsxs(e.li,{children:["Callbacks prefixed with ",n.jsx(e.code,{children:"on"}),": ",n.jsx(e.code,{children:"onClick"}),", ",n.jsx(e.code,{children:"onToggle"})]}),`
`]}),`
`,n.jsx(e.h3,{id:"css-classes",children:"CSS Classes"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsx(e.li,{children:"Tailwind utility classes for styling"}),`
`,n.jsxs(e.li,{children:["Custom classes prefixed with ",n.jsx(e.code,{children:"dl-"}),": ",n.jsx(e.code,{children:"bg-dl-dark"}),", ",n.jsx(e.code,{children:"text-dl-primary"})]}),`
`]}),`
`,n.jsx(e.h2,{id:"state-management",children:"State Management"}),`
`,n.jsx(e.h3,{id:"local-state",children:"Local State"}),`
`,n.jsx(e.p,{children:"Used for UI-only concerns:"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsx(e.li,{children:"Expanded/collapsed states"}),`
`,n.jsx(e.li,{children:"Form input values"}),`
`,n.jsx(e.li,{children:"Menu open/close states"}),`
`]}),`
`,n.jsx(e.h3,{id:"global-state-zustand",children:"Global State (Zustand)"}),`
`,n.jsx(e.p,{children:"Used for shared application state:"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsx(e.li,{children:"User settings"}),`
`,n.jsx(e.li,{children:"Captured events"}),`
`,n.jsx(e.li,{children:"Filter configurations"}),`
`]}),`
`,n.jsx(e.h2,{id:"file-organisation",children:"File Organisation"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{children:`src/
├── components/
│   └── shared/           # Reusable components
├── stories/
│   ├── atoms/           # Atom stories
│   ├── molecules/       # Molecule stories
│   ├── organisms/       # Organism stories
│   └── views/           # View stories
├── tokens/              # Design tokens
└── types/               # TypeScript types
`})}),`
`,n.jsx(e.h2,{id:"testing-guidelines",children:"Testing Guidelines"}),`
`,n.jsx(e.p,{children:"Each component should have:"}),`
`,n.jsxs(e.ol,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Unit tests"})," - Test props and callbacks"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Accessibility tests"})," - Using @storybook/addon-a11y"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Visual tests"})," - Storybook stories for each state"]}),`
`]}),`
`,n.jsx(e.h2,{id:"best-practices",children:"Best Practices"}),`
`,n.jsxs(e.ol,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Keep components focused"})," - Single responsibility"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Prop drilling"})," - Avoid more than 2-3 levels"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Composition over inheritance"})," - Use children and render props"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Consistent patterns"})," - Follow existing component patterns"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Document edge cases"})," - Add stories for error states, loading, empty states"]}),`
`]})]})}function x(s={}){const{wrapper:e}={...l(),...s.components};return e?n.jsx(e,{...s,children:n.jsx(i,{...s})}):i(s)}export{x as default};
