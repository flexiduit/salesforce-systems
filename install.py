from pathlib import Path
import sys, shutil
if len(sys.argv)!=2: raise SystemExit('Usage: python install.py /path/to/salesforce-systems')
root=Path(sys.argv[1]).expanduser().resolve()
source=root/'app/dashboard.tsx'; css=root/'app/globals.css'
if not source.is_file() or not css.is_file(): raise SystemExit('Expected app/dashboard.tsx and app/globals.css')
s=source.read_text()
if 'CompanyPanel' in s: raise SystemExit('Already installed')
checks=[("'use client';","'use client';\nimport CompanyPanel from './company-panel';"),
("[History,'Activity history']","[History,'Activity history'],[Building2,'About Company']"),
("<div className=\"top-actions\">","<nav className=\"topbar-quicknav\" aria-label=\"Top navigation\">{[['Dashboard','Dashboard'],['Customer Record','Customers'],['About Company','About Company']].map(([key,label])=><button key={key} type=\"button\" className={section===key?'selected':''} onClick={()=>nav(key)}>{label}</button>)}</nav><div className=\"top-actions\">"),
("<main><div className=\"heading\">","<main>{section==='About Company'&&<CompanyPanel/>}<div className=\"heading\">"),
("<h1>{section==='Dashboard'?'Customer & loan dashboard':section}</h1>","<h1>{section==='Dashboard'?'Customer & loan dashboard':section}</h1>"),
("/signout-with-chatgpt?return_to=%2F","/cdn-cgi/access/logout")]
# Add a known icon only when needed.
if 'Building2' not in s.split("from 'lucide-react'")[0]:
 s=s.replace('Pencil,Mail,Settings,','Pencil,Mail,Settings,Building2,',1)
for a,b in checks:
 if a not in s: raise SystemExit('Source changed; expected fragment not found: '+a[:90])
 s=s.replace(a,b)
if '/* FlexiDuit two-navigation layout' in css.read_text():raise SystemExit('Theme already installed')
shutil.copy2(source,str(source)+'.before-nav-v2.bak');shutil.copy2(css,str(css)+'.before-nav-v2.bak')
source.write_text(s)
(root/'app/company-panel.tsx').write_text((Path(__file__).parent/'company-panel.tsx').read_text())
with css.open('a') as f:f.write('\n'+(Path(__file__).parent/'nav-styles.css').read_text())
print('Installed. Review git diff and test npm run build before commit.')
