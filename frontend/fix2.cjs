const fs = require('fs');
const path = require('path');

const pagesDir = './src/pages';
const files = fs.readdirSync(pagesDir).map(file => path.join(pagesDir, file)).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix max-w wrapper gap
  content = content.replace(
    '<div className="max-w-[1600px] w-full mx-auto flex flex-col lg:flex-row justify-between xl:gap-8">',
    '<div className="max-w-[1600px] w-full mx-auto flex flex-col lg:flex-row justify-between gap-8 xl:gap-12">'
  );

  // Fix right column margin/padding
  const oldRightCol = 'className="lg:w-[360px] xl:w-[400px] flex-shrink-0 relative lg:ml-12 xl:ml-16 lg:border-l lg:pl-12 xl:pl-16 border-gray-300"';
  const newRightCol = 'className="lg:w-[320px] xl:w-[360px] flex-shrink-0 relative lg:border-l lg:pl-8 xl:pl-12 border-gray-300"';
  
  content = content.replace(oldRightCol, newRightCol);
  
  // also fix if they have border-[var(--border-subtle)] instead
  const oldRightCol2 = 'className="lg:w-[360px] xl:w-[400px] flex-shrink-0 relative lg:ml-12 xl:ml-16 lg:border-l lg:pl-12 xl:pl-16 border-[var(--border-subtle)]"';
  const newRightCol2 = 'className="lg:w-[320px] xl:w-[360px] flex-shrink-0 relative lg:border-l lg:pl-8 xl:pl-12 border-[var(--border-subtle)]"';
  
  content = content.replace(oldRightCol2, newRightCol2);

  fs.writeFileSync(file, content);
}
console.log('Fixed pages 2');
