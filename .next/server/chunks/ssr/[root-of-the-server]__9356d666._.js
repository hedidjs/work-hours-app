module.exports=[59866,(a,b,c)=>{b.exports=a.x("jspdf-9c3aba4aeb1eded9",()=>require("jspdf-9c3aba4aeb1eded9"))},83554,(a,b,c)=>{b.exports=a.x("html2canvas-2cd317ce0361f606",()=>require("html2canvas-2cd317ce0361f606"))},10731,a=>{"use strict";var b=a.i(79168),c=a.i(27068),d=a.i(32759),e=a.i(39141),f=a.i(6555),g=a.i(8171),h=a.i(27669),i=a.i(13906),j=a.i(59866),k=a.i(83554);async function l(a){let{workDays:b,employer:c,businessDetails:d,totals:e,startDate:f,endDate:g}=a,h=document.createElement("div");h.style.cssText=`
    position: fixed;
    left: -9999px;
    top: 0;
    width: 794px;
    padding: 40px;
    background: white;
    font-family: 'Heebo', Arial, sans-serif;
    direction: rtl;
    box-sizing: border-box;
  `;let l="תקופה: ";f&&g?l+=`${(0,i.formatDate)(f)} - ${(0,i.formatDate)(g)}`:f?l+=`מ-${(0,i.formatDate)(f)}`:g?l+=`עד ${(0,i.formatDate)(g)}`:l+="כל התקופה";let m=b.map(a=>`
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${(0,i.formatDate)(a.date)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${a.location||"-"}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${a.startTime} - ${a.endTime}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${(0,i.formatHours)(a.regularHours+a.overtimeHours)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${a.overtimeHours>0?(0,i.formatHours)(a.overtimeHours):"-"}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${a.kilometers}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${(0,i.formatCurrency)(a.totalWithVat)}</td>
    </tr>
  `).join("");h.innerHTML=`
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
      <div style="flex: 1;">
        <h1 style="font-size: 24px; color: #1f2937; margin: 0 0 20px 0;">דוח שעות עבודה</h1>
      </div>
      ${d.logo?`
        <div style="margin-right: 20px;">
          <img src="${d.logo}" style="max-width: 200px; max-height: 120px; object-fit: contain;" />
        </div>
      `:""}
    </div>

    <div style="margin-bottom: 20px; font-size: 14px; color: #374151;">
      ${d.name?`<div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${d.name}</div>`:""}
      ${d.businessNumber?`<div>ע.מ. / ח.פ.: ${d.businessNumber}</div>`:""}
      ${d.address?`<div>${d.address}</div>`:""}
      ${d.phone?`<div>טלפון: ${d.phone}</div>`:""}
      ${d.email?`<div>${d.email}</div>`:""}
    </div>

    <div style="margin-bottom: 20px; padding: 10px; background: #f3f4f6; border-radius: 6px;">
      <div style="font-size: 14px;">${l}</div>
      ${c?`<div style="font-size: 14px; margin-top: 5px;">מעסיק: ${c.name}</div>`:""}
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
      <thead>
        <tr style="background: #3b82f6; color: white;">
          <th style="border: 1px solid #3b82f6; padding: 8px; text-align: center;">תאריך</th>
          <th style="border: 1px solid #3b82f6; padding: 8px; text-align: center;">מיקום</th>
          <th style="border: 1px solid #3b82f6; padding: 8px; text-align: center;">משעה-עד</th>
          <th style="border: 1px solid #3b82f6; padding: 8px; text-align: center;">שעות</th>
          <th style="border: 1px solid #3b82f6; padding: 8px; text-align: center;">נוספות</th>
          <th style="border: 1px solid #3b82f6; padding: 8px; text-align: center;">ק"מ</th>
          <th style="border: 1px solid #3b82f6; padding: 8px; text-align: center;">סה"כ</th>
        </tr>
      </thead>
      <tbody>
        ${m}
      </tbody>
      <tfoot>
        <tr style="background: #e5e7eb; font-weight: bold;">
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">סה"כ</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${(0,i.formatHours)(e.hours)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">-</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${e.km}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${(0,i.formatCurrency)(e.withVat)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-bottom: 20px; text-align: left; font-size: 14px;">
      <div style="margin-bottom: 8px;">סה"כ לפני מע"מ: ${(0,i.formatCurrency)(e.beforeVat)}</div>
      <div style="font-weight: bold; font-size: 16px; color: #059669;">סה"כ לתשלום כולל מע"מ: ${(0,i.formatCurrency)(e.withVat)}</div>
    </div>

    ${c?`
      <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 6px; border: 1px solid #bae6fd;">
        <div style="font-weight: bold; margin-bottom: 10px; font-size: 14px;">תעריפים:</div>
        <div style="font-size: 13px; color: #374151; display: flex; gap: 30px; flex-wrap: wrap;">
          <div>יומית (עד 12 שעות): ${(0,i.formatCurrency)(c.dailyRate)}</div>
          <div>שעה נוספת: ${(0,i.formatCurrency)(c.overtimeRate)}</div>
          <div>קילומטר: ${(0,i.formatCurrency)(c.kmRate)}</div>
          <div>מע"מ: ${c.vatPercent}%</div>
        </div>
        ${c.bonuses&&c.bonuses.length>0?`
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #bae6fd;">
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">תוספות אפשריות:</div>
            <div style="font-size: 13px; color: #374151; display: flex; gap: 20px; flex-wrap: wrap;">
              ${c.bonuses.map(a=>`<div>${a.name}: ${(0,i.formatCurrency)(a.amount)}</div>`).join("")}
            </div>
          </div>
        `:""}
      </div>
    `:""}

    ${d.bankName||d.bankBranch||d.bankAccount?`
      <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
        <div style="font-weight: bold; margin-bottom: 10px; font-size: 14px;">פרטי העברה בנקאית:</div>
        <div style="font-size: 13px; color: #374151;">
          ${d.bankName?`<div>בנק: ${d.bankName}</div>`:""}
          ${d.bankBranch?`<div>סניף: ${d.bankBranch}</div>`:""}
          ${d.bankAccount?`<div>חשבון: ${d.bankAccount}</div>`:""}
        </div>
      </div>
    `:""}
  `,document.body.appendChild(h);try{await new Promise(a=>setTimeout(a,100));let a=await (0,k.default)(h,{scale:2,useCORS:!0,allowTaint:!0,backgroundColor:"#ffffff"}),b=a.toDataURL("image/png"),d=new j.default({orientation:"portrait",unit:"mm",format:"a4"}),e=d.internal.pageSize.getWidth(),f=d.internal.pageSize.getHeight(),g=a.width,i=a.height,l=Math.min(e/g,f/i);d.addImage(b,"PNG",(e-g*l)/2,0,g*l,i*l);let m=c?`דוח_שעות_${c.name}_${new Date().toISOString().split("T")[0]}.pdf`:`דוח_שעות_${new Date().toISOString().split("T")[0]}.pdf`;d.save(m)}finally{document.body.removeChild(h)}}function m({workDays:a,employers:b,businessDetails:c}){let[d,e]=(0,h.useState)(""),[f,j]=(0,h.useState)(""),[k,m]=(0,h.useState)(""),[n,o]=(0,h.useState)(!1),p=(0,h.useMemo)(()=>{let b=f,c=k;return f&&k&&f>k&&(b=k,c=f),a.filter(a=>(!d||a.employerId===d)&&(!b||!(a.date<b))&&(!c||!(a.date>c))).sort((a,b)=>a.date.localeCompare(b.date))},[a,d,f,k]),q=(0,h.useMemo)(()=>p.reduce((a,b)=>({hours:a.hours+b.regularHours+b.overtimeHours,km:a.km+b.kilometers,beforeVat:a.beforeVat+b.totalBeforeVat,withVat:a.withVat+b.totalWithVat}),{hours:0,km:0,beforeVat:0,withVat:0}),[p]),r=(0,h.useMemo)(()=>b.find(a=>a.id===d),[b,d]),s=async()=>{if(0===p.length)return void alert("אין נתונים לייצוא");let a=f,b=k;f&&k&&f>k&&(a=k,b=f),o(!0);try{await l({workDays:p,employer:r,businessDetails:c,totals:q,startDate:a,endDate:b})}catch(a){console.error("Error generating PDF:",a),alert("שגיאה ביצירת ה-PDF")}o(!1)};return(0,g.jsxs)("div",{className:"pb-4",children:[(0,g.jsx)("h2",{className:"text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6",children:"ייצוא דוח"}),(0,g.jsxs)("div",{className:"bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 transition-colors mb-4 md:mb-6",children:[(0,g.jsx)("h3",{className:"font-medium text-gray-900 dark:text-white mb-3 md:mb-4 text-sm md:text-base",children:"בחירת נתונים לייצוא"}),(0,g.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6",children:[(0,g.jsxs)("div",{children:[(0,g.jsx)("label",{className:"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",children:"מעסיק"}),(0,g.jsxs)("select",{value:d,onChange:a=>e(a.target.value),className:"w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",children:[(0,g.jsx)("option",{value:"",children:"כל המעסיקים"}),b.map(a=>(0,g.jsx)("option",{value:a.id,children:a.name},a.id))]})]}),(0,g.jsxs)("div",{children:[(0,g.jsx)("label",{className:"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",children:"מתאריך"}),(0,g.jsx)("input",{type:"date",value:f,onChange:a=>j(a.target.value),className:"w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"})]}),(0,g.jsxs)("div",{children:[(0,g.jsx)("label",{className:"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",children:"עד תאריך"}),(0,g.jsx)("input",{type:"date",value:k,onChange:a=>m(a.target.value),className:"w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"})]})]}),p.length>0?(0,g.jsxs)("div",{className:"border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 mb-4 md:mb-6",children:[(0,g.jsxs)("h4",{className:"font-medium text-gray-700 dark:text-gray-300 mb-2 md:mb-3 text-sm md:text-base",children:["תצוגה מקדימה (",p.length," ימים)"]}),(0,g.jsx)("div",{className:"md:hidden space-y-2",children:p.map(a=>(0,g.jsxs)("div",{className:"bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 rounded-lg p-3 flex justify-between items-center",children:[(0,g.jsxs)("div",{children:[(0,g.jsx)("div",{className:"font-medium text-sm",children:(0,i.formatDate)(a.date)}),(0,g.jsx)("div",{className:"text-xs text-gray-500 dark:text-gray-400",children:a.location||"-"})]}),(0,g.jsxs)("div",{className:"text-left",children:[(0,g.jsx)("div",{className:"font-medium text-sm text-green-600 dark:text-green-400",children:(0,i.formatCurrency)(a.totalWithVat)}),(0,g.jsxs)("div",{className:"text-xs text-gray-500 dark:text-gray-400",children:[(0,i.formatHours)(a.regularHours+a.overtimeHours)," שעות"]})]})]},a.id))}),(0,g.jsx)("div",{className:"hidden md:block overflow-x-auto",children:(0,g.jsxs)("table",{className:"min-w-full text-sm",children:[(0,g.jsx)("thead",{className:"bg-gray-50 dark:bg-gray-700",children:(0,g.jsxs)("tr",{children:[(0,g.jsx)("th",{className:"px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400",children:"תאריך"}),(0,g.jsx)("th",{className:"px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400",children:"מיקום"}),(0,g.jsx)("th",{className:"px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400",children:"שעות"}),(0,g.jsx)("th",{className:"px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400",children:"נוספות"}),(0,g.jsx)("th",{className:"px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400",children:'ק"מ'}),(0,g.jsx)("th",{className:"px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400",children:'סה"כ'})]})}),(0,g.jsx)("tbody",{className:"divide-y divide-gray-200 dark:divide-gray-700",children:p.map(a=>(0,g.jsxs)("tr",{children:[(0,g.jsx)("td",{className:"px-3 py-2",children:(0,i.formatDate)(a.date)}),(0,g.jsx)("td",{className:"px-3 py-2",children:a.location||"-"}),(0,g.jsx)("td",{className:"px-3 py-2",children:(0,i.formatHours)(a.regularHours)}),(0,g.jsx)("td",{className:"px-3 py-2",children:a.overtimeHours>0?(0,i.formatHours)(a.overtimeHours):"-"}),(0,g.jsx)("td",{className:"px-3 py-2",children:a.kilometers||"-"}),(0,g.jsx)("td",{className:"px-3 py-2 font-medium",children:(0,i.formatCurrency)(a.totalWithVat)})]},a.id))}),(0,g.jsx)("tfoot",{className:"bg-gray-50 dark:bg-gray-700 font-medium",children:(0,g.jsxs)("tr",{children:[(0,g.jsx)("td",{colSpan:2,className:"px-3 py-2",children:'סה"כ'}),(0,g.jsx)("td",{className:"px-3 py-2",children:(0,i.formatHours)(q.hours)}),(0,g.jsx)("td",{className:"px-3 py-2",children:"-"}),(0,g.jsx)("td",{className:"px-3 py-2",children:q.km}),(0,g.jsx)("td",{className:"px-3 py-2",children:(0,i.formatCurrency)(q.withVat)})]})})]})}),(0,g.jsxs)("div",{className:"mt-3 md:mt-4 grid grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm bg-blue-50 dark:bg-blue-900/30 p-3 rounded",children:[(0,g.jsxs)("div",{children:[(0,g.jsx)("span",{className:"text-gray-600 dark:text-gray-400",children:'סה"כ לפני מע"מ:'}),(0,g.jsx)("span",{className:"font-medium mr-1 md:mr-2",children:(0,i.formatCurrency)(q.beforeVat)})]}),(0,g.jsxs)("div",{children:[(0,g.jsx)("span",{className:"text-gray-600 dark:text-gray-400",children:'סה"כ כולל מע"מ:'}),(0,g.jsx)("span",{className:"font-medium mr-1 md:mr-2 text-green-600 dark:text-green-400",children:(0,i.formatCurrency)(q.withVat)})]})]})]}):(0,g.jsx)("div",{className:"border border-gray-200 dark:border-gray-700 rounded-lg p-6 md:p-8 text-center text-gray-500 dark:text-gray-400 mb-4 md:mb-6",children:"אין נתונים לייצוא לפי הסינון שנבחר"}),(0,g.jsx)("button",{onClick:s,disabled:0===p.length||n,className:"w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",children:n?(0,g.jsxs)(g.Fragment,{children:[(0,g.jsx)("span",{className:"animate-spin",children:"⏳"}),"יוצר PDF..."]}):(0,g.jsx)(g.Fragment,{children:"📄 ייצוא ל-PDF"})})]})]})}a.s(["ExportPage",()=>m],33627);var n=a.i(33627),o=a.i(9193);let p=(0,d.hoist)(n,"default"),q=(0,d.hoist)(n,"getStaticProps"),r=(0,d.hoist)(n,"getStaticPaths"),s=(0,d.hoist)(n,"getServerSideProps"),t=(0,d.hoist)(n,"config"),u=(0,d.hoist)(n,"reportWebVitals"),v=(0,d.hoist)(n,"unstable_getStaticProps"),w=(0,d.hoist)(n,"unstable_getStaticPaths"),x=(0,d.hoist)(n,"unstable_getStaticParams"),y=(0,d.hoist)(n,"unstable_getServerProps"),z=(0,d.hoist)(n,"unstable_getServerSideProps"),A=new b.PagesRouteModule({definition:{kind:c.RouteKind.PAGES,page:"/ExportPage",pathname:"/ExportPage",bundlePath:"",filename:""},distDir:".next",relativeProjectDir:"",components:{App:f.default,Document:e.default},userland:n}),B=(0,o.getHandler)({srcPage:"/ExportPage",config:t,userland:n,routeModule:A,getStaticPaths:r,getStaticProps:q,getServerSideProps:s});a.s(["config",0,t,"default",0,p,"getServerSideProps",0,s,"getStaticPaths",0,r,"getStaticProps",0,q,"handler",0,B,"reportWebVitals",0,u,"routeModule",0,A,"unstable_getServerProps",0,y,"unstable_getServerSideProps",0,z,"unstable_getStaticParams",0,x,"unstable_getStaticPaths",0,w,"unstable_getStaticProps",0,v],10731)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__9356d666._.js.map