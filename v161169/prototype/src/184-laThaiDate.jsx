// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — นิติกรรม: เอกสารพิมพ์ (แก้ไขได้ก่อนพิมพ์)
//   • หนังสือนิติกรรมจำนอง (deed)
//   • หนังสือมอบอำนาจ (poa)
//   • สัญญาจำนอง / สัญญาจำนองเฉพาะส่วน (mortgage)
//   • สัญญาต่อท้าย (annex)
//  ใช้โครงพิมพ์ร่วม .lrq-printview / .lrq-print-portal / .lrqd-sheet
//  ─ ระหว่างพรีวิว ผู้ใช้แก้ไขเนื้อหาเอกสารได้ (contentEditable) แล้วจึงพิมพ์
// ════════════════════════════════════════════════════════════════════

const { useState: laUseState, useEffect: laUseEffect, useRef: laUseRef } = React;

// วันที่แบบไทย (รองรับทั้ง ค.ศ. และ พ.ศ.)
function laThaiDate(d) {
  if (!d) return '……………';
  const s = String(d);
  let y, m, day;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) { y = +iso[1]; m = +iso[2]; day = +iso[3]; }
  else return s;
  if (y < 2400) y += 543;
  const months = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  return `วันที่ ${day} เดือน${months[m]} พ.ศ. ${y}`;
}
const laBaht = (n) => (Number(n) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── ตัวสร้างเนื้อหาเริ่มต้นของเอกสาร (HTML) ─────────────────────────
function laDocHtml(docType, ctx) {
  const { member, rec, assets, type } = ctx;
  const coop = window.COOP_NAME_FULL || 'สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด';
  const sel = (assets || []).filter(a => (rec.assetIds || []).includes(a.id));
  const assetList = sel.length
    ? sel.map(a => `<li>${a.type} เลขที่ ${a.titleNo} เนื้อที่ ${a.area} ตั้งอยู่ ${a.loc} (${a.office})</li>`).join('')
    : '<li>……………………………………………………………………………………</li>';
  const amount = rec.amount ? `${laBaht(rec.amount)} บาท (……………………………………)` : '……………………………… บาท';
  const dateLine = laThaiDate(rec.regDate);
  const P = (s) => `<p class="lap">${s}</p>`;

  if (docType === 'poa') {
    return [
      `<p class="lat">หนังสือมอบอำนาจ</p>`,
      P(`ทำที่ ${rec.landOffice || '……………………………'}`),
      P(`${dateLine}`),
      P(`โดยหนังสือฉบับนี้ ข้าพเจ้า <b>${member.name}</b> เลขประจำตัวประชาชน ${member.citizenId} อยู่สังกัด ${member.dept} ในฐานะผู้มอบอำนาจ`),
      P(`ขอมอบอำนาจให้ <b>${rec.attorney || '……………………………………'}</b> เลขประจำตัวประชาชน ${rec.attorneyId || '………………………………'} เป็นผู้รับมอบอำนาจ กระทำการแทนข้าพเจ้าในการดำเนินการ<b>${type.label}${rec.subtype ? ' (' + rec.subtype + ')' : ''}</b> ต่อพนักงานเจ้าหน้าที่ ณ ${rec.landOffice || '……………………………'} สำหรับหลักทรัพย์ดังต่อไปนี้</p>`),
      `<ul class="lau">${assetList}</ul>`,
      P(`ตลอดจนให้ถ้อยคำ ลงลายมือชื่อ รับ-ส่งเอกสาร และชำระค่าธรรมเนียมต่าง ๆ ที่เกี่ยวข้องจนเสร็จการ กิจการใดที่ผู้รับมอบอำนาจได้กระทำไปภายในขอบเขตแห่งการมอบอำนาจนี้ ให้ถือเสมือนว่าข้าพเจ้าได้กระทำด้วยตนเองทุกประการ`),
      `<div class="lasign3"><div class="lasign"><div class="lal"></div>ลงชื่อ ${member.name}<br/>ผู้มอบอำนาจ</div><div class="lasign"><div class="lal"></div>ลงชื่อ ${rec.attorney || ''}<br/>ผู้รับมอบอำนาจ</div><div class="lasign"><div class="lal"></div>ลงชื่อ<br/>พยาน</div></div>`,
    ].join('');
  }

  if (docType === 'mortgage') {
    const partial = rec.subtype && rec.subtype.indexOf('เฉพาะส่วน') >= 0;
    return [
      `<p class="lat">สัญญาจำนอง${partial ? 'เฉพาะส่วน' : ''}เป็นประกัน</p>`,
      P(`ทำที่ ${rec.landOffice || '……………………………'}&nbsp;&nbsp;&nbsp;${dateLine}`),
      P(`สัญญานี้ทำขึ้นระหว่าง <b>${member.name}</b> เลขประจำตัวประชาชน ${member.citizenId} ซึ่งต่อไปในสัญญานี้เรียกว่า “ผู้จำนอง” ฝ่ายหนึ่ง กับ <b>${coop}</b> ซึ่งต่อไปในสัญญานี้เรียกว่า “ผู้รับจำนอง” อีกฝ่ายหนึ่ง`),
      P(`ข้อ 1. ผู้จำนองตกลงจำนองที่ดิน/ทรัพย์สินของตน${partial ? 'เฉพาะส่วนของผู้จำนอง' : ''} ดังต่อไปนี้ ไว้แก่ผู้รับจำนอง เพื่อเป็นประกันหนี้ตามสัญญากู้เงินเลขที่ ${rec.contractNo || '………………'} (คำขอกู้เลขที่ ${rec.reqNo || '………………'})`),
      `<ul class="lau">${assetList}</ul>`,
      P(`ข้อ 2. ผู้จำนองตกลงจำนองเป็นวงเงินจำนอง ${amount} พร้อมดอกเบี้ยและค่าอุปกรณ์ตามที่กำหนดในสัญญากู้เงินและสัญญาต่อท้าย`),
      P(`ข้อ 3. หากผู้จำนองผิดนัดชำระหนี้ ผู้รับจำนองมีสิทธิบังคับจำนองและบังคับชำระหนี้เอาจากทรัพย์จำนองได้ตามกฎหมาย`),
      P(`คู่สัญญาได้อ่านและเข้าใจข้อความโดยตลอดแล้ว จึงลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน`),
      `<div class="lasign3"><div class="lasign"><div class="lal"></div>ลงชื่อ ${member.name}<br/>ผู้จำนอง</div><div class="lasign"><div class="lal"></div>ลงชื่อ<br/>ผู้รับจำนอง</div><div class="lasign"><div class="lal"></div>ลงชื่อ<br/>พยาน</div></div>`,
    ].join('');
  }

  if (docType === 'annex') {
    return [
      `<p class="lat">สัญญาต่อท้ายสัญญาจำนองเป็นประกัน</p>`,
      P(`ประกอบสัญญาจำนองเลขที่นิติกรรม ${rec.actNo} ${dateLine}`),
      P(`สัญญาต่อท้ายนี้เป็นส่วนหนึ่งของสัญญาจำนองระหว่าง <b>${member.name}</b> (ผู้จำนอง) กับ <b>${coop}</b> (ผู้รับจำนอง) โดยคู่สัญญาตกลงกันเพิ่มเติมดังนี้`),
      P(`ข้อ 1. ผู้จำนองยินยอมให้ทรัพย์จำนองตามรายการแนบท้ายเป็นประกันหนี้ทุกประเภทที่ผู้จำนองมีต่อผู้รับจำนอง ทั้งที่มีอยู่แล้วในขณะทำสัญญาและที่จะมีขึ้นในภายหน้า ในวงเงินจำนอง ${amount}`),
      `<ul class="lau">${assetList}</ul>`,
      P(`ข้อ 2. ผู้จำนองยอมเสียดอกเบี้ยในอัตราตามระเบียบสหกรณ์ และยินยอมให้ผู้รับจำนองเพิ่ม/ลดวงเงินจำนองได้ตามข้อบังคับ`),
      P(`ข้อ 3. ในกรณีไถ่ถอน/แบ่งไถ่ถอน/ปลอดจำนองบางส่วน ผู้จำนองยินยอมให้ดำเนินการได้เมื่อชำระหนี้ครบถ้วนตามส่วนที่เกี่ยวข้อง`),
      `<div class="lasign3"><div class="lasign"><div class="lal"></div>ลงชื่อ ${member.name}<br/>ผู้จำนอง</div><div class="lasign"><div class="lal"></div>ลงชื่อ<br/>ผู้รับจำนอง</div><div class="lasign"><div class="lal"></div>ลงชื่อ<br/>พยาน</div></div>`,
    ].join('');
  }

  // deed — หนังสือนิติกรรมจำนอง (บันทึกถ้อยคำ/บันทึกการทำนิติกรรม)
  const feeTotal = window.laFeeTotal(rec.fees);
  return [
    `<p class="lat">หนังสือนิติกรรม${type.label}</p>`,
    P(`เลขที่นิติกรรม ${rec.actNo}&nbsp;&nbsp;&nbsp;ทำที่ ${rec.landOffice || '……………………………'}`),
    P(`${dateLine}`),
    P(`บันทึกไว้ว่า พนักงานเจ้าหน้าที่ได้ทำนิติกรรม<b>${type.label}${rec.subtype ? ' — ' + rec.subtype : ''}</b> ให้แก่ <b>${member.name}</b> เลขประจำตัวประชาชน ${member.citizenId} สังกัด ${member.dept} คู่นิติกรรมกับ <b>${coop}</b> เพื่อประกอบสัญญากู้เงินเลขที่ ${rec.contractNo || '………………'} สำหรับหลักทรัพย์ดังต่อไปนี้</p>`),
    `<ul class="lau">${assetList}</ul>`,
    (type.needsAmount ? P(`วงเงินตามนิติกรรม ${amount}`) : ''),
    P(`ค่าธรรมเนียมและค่าใช้จ่ายในการจดทะเบียน: ค่าธรรมเนียม ${laBaht(rec.fees && rec.fees.register)} บาท · ค่าจดนิติกรรม ${laBaht(rec.fees && rec.fees.act)} บาท · ค่าอากรแสตมป์ ${laBaht(rec.fees && rec.fees.stamp)} บาท · อื่น ๆ ${laBaht(rec.fees && rec.fees.other)} บาท รวม <b>${laBaht(feeTotal)} บาท</b>`),
    P(`คู่กรณีได้ตรวจสอบและรับทราบข้อความข้างต้นถูกต้องตรงตามความประสงค์แล้ว จึงลงลายมือชื่อไว้เป็นสำคัญ`),
    `<div class="lasign3"><div class="lasign"><div class="lal"></div>ลงชื่อ ${member.name}<br/>ผู้ขอทำนิติกรรม</div><div class="lasign"><div class="lal"></div>ลงชื่อ<br/>ผู้รับมอบอำนาจสหกรณ์</div><div class="lasign"><div class="lal"></div>ลงชื่อ<br/>พนักงานเจ้าหน้าที่</div></div>`,
  ].filter(Boolean).join('');
}

// ── แผ่นเอกสารเดียว (letterhead + เนื้อหาแก้ไขได้) ───────────────────
function LegalActSheet({ docType, rec, member, assets, editing, bodyRef }) {
  const type = window.laType(rec.typeCode);
  const meta = (() => { const d = new Date(); return { date: d.toLocaleDateString('th-TH'), time: d.toTimeString().slice(0, 5) }; })();
  const html = (rec.docEdits && rec.docEdits[docType]) || laDocHtml(docType, { member, rec, assets, type });
  return (
    <div className="lrqd-sheet la-sheet">
      <div className="lrqd-letterhead"><CoopLetterheadBlock /></div>
      <div className="la-doc-meta">พิมพ์วันที่ {meta.date} เวลา {meta.time} น. · ผู้พิมพ์ {rec.createdBy || window.laUser} · เลขที่นิติกรรม {rec.actNo}</div>
      <div
        className={"la-doc-body" + (editing ? " editing" : "")}
        ref={bodyRef}
        contentEditable={editing}
        suppressContentEditableWarning={true}
        spellCheck={false}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

// ── Overlay พรีวิว + แก้ไข + พิมพ์ ───────────────────────────────────
function LegalActPrintOverlay({ docType, rec, member, assets, onClose, onSaveEdits }) {
  const [editing, setEditing] = laUseState(false);
  const bodyRef = laUseRef(null);
  const label = (window.LA_DOC_TYPES.find(d => d.v === docType) || {}).label || 'เอกสารนิติกรรม';
  const clearPrintClass = () => document.documentElement.classList.remove('lrq-printing');

  laUseEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { clearPrintClass(); close(); } };
    document.addEventListener('keydown', onKey);
    const mq = window.matchMedia && window.matchMedia('print');
    const onMq = (m) => { if (!m.matches) clearPrintClass(); };
    if (mq && mq.addEventListener) mq.addEventListener('change', onMq);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (mq && mq.removeEventListener) mq.removeEventListener('change', onMq);
      clearPrintClass();
    };
    // eslint-disable-next-line
  }, []);

  const captureEdits = () => {
    if (bodyRef.current && onSaveEdits) onSaveEdits(docType, bodyRef.current.innerHTML);
  };
  const toggleEdit = () => {
    if (editing) captureEdits();
    setEditing(e => !e);
  };
  const doPrint = () => {
    if (editing) { captureEdits(); setEditing(false); }
    document.documentElement.classList.add('lrq-printing');
    const cleanup = () => { clearPrintClass(); window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    try { window.print(); } catch (e) {}
    setTimeout(clearPrintClass, 1500);
  };
  const close = () => { clearPrintClass(); if (editing) captureEdits(); onClose(); };

  return (
    <div className="lrq-printview">
      <div className="lrq-printview-bar lrq-noprint">
        <button className="btn sm" onClick={close}><Icon name="chevLeft" /> กลับ</button>
        <span className="lrq-printview-title">พรีวิว — {label}</span>
        {editing && <span className="chip warning" style={{ marginLeft: 4 }}><Icon name="edit" size={11} /> กำลังแก้ไขเนื้อหา</span>}
        <span className="spacer" />
        <button className={"btn sm" + (editing ? " primary" : "")} onClick={toggleEdit}>
          <Icon name={editing ? "check" : "edit"} /> {editing ? 'เสร็จสิ้นการแก้ไข' : 'แก้ไขเนื้อหาก่อนพิมพ์'}
        </button>
        <button className="btn primary sm" onClick={doPrint}><Icon name="print" /> พิมพ์เอกสาร</button>
        <button className="btn sm" onClick={close} title="ปิด (Esc)"><Icon name="close" /></button>
      </div>
      {editing && (
        <div className="la-edit-hint lrq-noprint"><Icon name="info" size={12} /> คลิกในเอกสารเพื่อแก้ไขข้อความได้โดยตรง — เมื่อพอใจแล้วกด “เสร็จสิ้นการแก้ไข” หรือ “พิมพ์เอกสาร”</div>
      )}
      <div className="lrq-printview-scroll">
        <div className="lrq-print-portal">
          <LegalActSheet docType={docType} rec={rec} member={member} assets={assets} editing={editing} bodyRef={bodyRef} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LegalActPrintOverlay, laDocHtml, laThaiDate });
