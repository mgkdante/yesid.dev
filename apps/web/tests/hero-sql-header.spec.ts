import { test, expect } from '@playwright/test';
// Published block_hero.sql_live_label values from the supplied CMS captures, not replacements for product content.
const cases = [
	{path:'/',label:'Simulated data'},
	{path:'/fr',label:'Données simulées'},
	{path:'/es',label:'Datos simulados'},
];
for(const entry of cases) for(const width of [320,360,390,430,1440]) test(`${entry.path} SQL header stays readable at ${width}`,async({page},info)=>{
	await page.setViewportSize({width,height:900});
	await page.route(/plausible|google-analytics|web3forms|cal\.com|\/api\/(?:contact|event)/,r=>r.abort());
	await page.goto(entry.path);
	await expect(page.getByTestId('hero-dot-replay')).toBeEnabled();
	if(width<1024) await page.getByTestId('hero-mobile-sql').getByRole('button',{expanded:false}).click();
	const panel=page.getByTestId('sql-panel').filter({visible:true});
	const prompt=panel.getByTestId('sql-prompt'),label=panel.getByTestId('sql-live');
	// The build fixture still says DEMO; exercise the same rendered component with today's CMS label lengths.
	await label.evaluate((el,text)=>{el.textContent=text;},entry.label);
	await page.evaluate(()=>document.fonts.ready);
	const p=await prompt.boundingBox(),l=await label.boundingBox();
	if(width<=430) expect(l!.y).toBeGreaterThanOrEqual(p!.y+p!.height);
	else {expect(l!.x).toBeGreaterThan(p!.x+p!.width);expect(Math.abs(l!.y+l!.height/2-p!.y-p!.height/2)).toBeLessThan(1);}
	const lines=await prompt.evaluate(el=>{
		const node=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent?.trim());
		if(!node)throw new Error('Prompt text is missing');
		const range=document.createRange();range.selectNodeContents(node);
		const rects=[...range.getClientRects()].filter(r=>r.width>0);
		return {height:Math.max(...rects.map(r=>r.bottom))-Math.min(...rects.map(r=>r.top)),line:parseFloat(getComputedStyle(el).lineHeight)};
	});
	expect(lines.height).toBeLessThanOrEqual(lines.line+1);
	expect(l!.height).toBeLessThanOrEqual(await label.evaluate(el=>parseFloat(getComputedStyle(el).lineHeight))+1);
	expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
	await expect(label).toHaveText(entry.label);
	await panel.screenshot({path:info.outputPath('sql-header.png')});
});
