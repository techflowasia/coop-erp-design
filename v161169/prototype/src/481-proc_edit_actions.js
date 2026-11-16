// ════════════════════════════════════════════════════════════════════
//  ระบบรวม: ยกมาจาก 420-mod.js ส่วนที่ 2 ของระบบประมวลผล
//  (PcEditActions / PcHistoryModal / pcAskDiscard / pcShowSaved)
//  ส่วน ToggleConfirmModal ของต้นทางไม่นำมา — ระบบรวมใช้ src/415 อยู่แล้ว
//  พฤติกรรมทั้งหน้า ("ยกเลิก" → "ละทิ้ง" + ยืนยัน, แจ้งบันทึกสำเร็จ) จำกัดเฉพาะ
//  หน้า #process/* และ #loan/ban เพื่อไม่ให้กระทบระบบอื่น
// ════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════
//  Design System — ปุ่มแก้ไขข้อมูลมาตรฐาน + ละทิ้ง/บันทึก ทั้งระบบ
//  • window.PcEditActions — ป้ายบันทึกล่าสุด · ประวัติ · แก้ไขข้อมูล ↔ ละทิ้ง · บันทึกข้อมูล
//  • ปุ่ม "ยกเลิก" ทุกปุ่ม (ยกเว้นหน้าต่างยืนยัน) → "ละทิ้ง" + ยืนยันก่อนละทิ้ง
//  • ปุ่ม "บันทึก…" ที่สำเร็จ → หน้าต่าง "บันทึกข้อมูลเรียบร้อยแล้ว"
// ═════════════════════════════════════════════════════════════════
(function () {
  if (window.__pcGuard) return;
  window.__pcGuard = true;
  const pcInScope = () => { const hh = String(window.location.hash || ''); return hh.indexOf('#process/') === 0 || hh === '#loan/ban'; };
  const h = React.createElement;
  const css = [
    '.pc-locked :is(input,select,textarea,button,[role=switch]):not([data-pc-keep]):not([data-pc-keep] *):not([data-pc-own]):not([data-pc-own] *):not([role=tab]):not(.sh-pg):not(.sh-per):not(.act-view):not(.lrq-eyebtn){pointer-events:none}',
    '.pc-locked :is(input,select,textarea):not([data-pc-keep]):not([data-pc-keep] *){background-color:var(--surface-muted,#f7f8f7)!important;color:rgba(0,0,0,.72)}',
    '.pc-locked button:not([data-pc-keep]):not([data-pc-keep] *):not([data-pc-own]):not([data-pc-own] *):not([role=tab]):not(.sh-pg):not(.act-view):not(.lrq-eyebtn){opacity:.55}',
    '.pc-edit-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.pc-edit-actions .btn{min-height:34px}',
    '.icr-form-actions .btn,.page-actions .lb-top-actions .btn,.page-actions .ls-head-actions .btn{min-height:34px}'
  ].join('\n');
  const st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  let root = null;
  const mount = el => {
    if (!root) {
      const d = document.createElement('div');
      d.id = 'pc-guard-root';
      document.body.appendChild(d);
      root = ReactDOM.createRoot(d);
    }
    root.render(el);
  };
  const close = () => root && root.render(null);
  const pad = n => String(n).padStart(2, '0');
  const nowTs = () => {
    const t = new Date();
    return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()) + ' ' + pad(t.getHours()) + ':' + pad(t.getMinutes());
  };
  const label = ts => window.savedBadgeLabel && window.savedBadgeLabel(ts) || 'บันทึกล่าสุด: ' + ts;
  const thTs = ts => (label(ts) || '').replace('บันทึกล่าสุด: ', '');

  // ยืนยันละทิ้ง (รูปแบบเดียวกับข้อกำหนดประเภทหุ้น)
  window.pcAskDiscard = onDiscard => {
    const M = window.ShDiscardModal;
    if (!M) {
      onDiscard && onDiscard();
      return;
    }
    mount(h(M, {
      onKeep: close,
      onDiscard: () => {
        close();
        onDiscard && onDiscard();
      }
    }));
  };
  // แจ้งบันทึกสำเร็จ
  window.pcShowSaved = detail => {
    const S = window.StatusModal;
    if (!S) return;
    mount(h(S, {
      variant: 'success',
      title: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      detail: detail || 'ระบบบันทึกข้อมูลเรียบร้อยแล้ว',
      onClose: close
    }));
  };

  // ─── ประวัติการบันทึก (ต่อรายการ) ───
  const HIST = {};
  function PcHistoryModal({
    title,
    sub,
    rows,
    onClose
  }) {
    const G = '#237450';
    const items = rows.slice().reverse();
    const ico = d => h("svg", {
      width: 15,
      height: 15,
      viewBox: "0 0 16 16",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.5,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, h("path", {
      d: d
    }));
    const tsTxt = ts => {
      const l = thTs(ts);
      return l.replace(/ (\d{2}:\d{2})/, ' · $1');
    };
    const dOnly = ts => thTs(String(ts).slice(0, 10));
    return h("div", {
      style: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.45)',
        zIndex: 945,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      },
      onClick: onClose
    }, h("div", {
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "ประวัติการเพิ่ม/แก้ไข" + (title || ''),
      onClick: e => e.stopPropagation(),
      style: {
        width: 640,
        maxWidth: '100%',
        maxHeight: '86vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 6px 24px rgba(0,0,0,.18)',
        overflow: 'hidden'
      }
    }, h("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '18px 20px',
        borderBottom: '1px solid #f0f0f0'
      }
    }, h("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 9999,
        background: '#eafef2',
        color: G,
        flexShrink: 0
      }
    }, h(Icon, {
      name: "history",
      size: 18
    })), h("div", {
      style: {
        minWidth: 0,
        flex: 1
      }
    }, h("div", {
      style: {
        fontSize: 16,
        fontWeight: 700,
        color: 'rgba(0,0,0,.88)'
      }
    }, "ประวัติการเพิ่ม/แก้ไข", title || ''), h("div", {
      style: {
        fontSize: 12,
        color: 'rgba(0,0,0,.5)',
        marginTop: 2
      }
    }, sub ? sub + ' — ' : '', "บันทึกทุกการเปลี่ยนแปลงเพื่อการตรวจสอบ")), h("button", {
      type: "button",
      "aria-label": "ปิด",
      onClick: onClose,
      style: {
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        color: 'rgba(0,0,0,.45)',
        width: 28,
        height: 28,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, h(Icon, {
      name: "close",
      size: 16
    }))), h("div", {
      style: {
        overflow: 'auto',
        padding: '4px 20px'
      }
    }, items.length === 0 && h("div", {
      style: {
        padding: '28px 0',
        textAlign: 'center',
        fontSize: 13,
        color: 'rgba(0,0,0,.45)'
      }
    }, "ยังไม่มีประวัติการแก้ไข"), items.map((r, i) => {
      const create = r.kind === 'create';
      return h("div", {
        key: i,
        style: {
          display: 'flex',
          gap: 14,
          padding: '16px 0',
          borderBottom: i < items.length - 1 ? '1px solid #f0f0f0' : 'none',
          position: 'relative'
        }
      }, h("div", {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexShrink: 0
        }
      }, h("span", {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          borderRadius: 9999,
          background: '#eafef2',
          color: G
        }
      }, ico(create ? 'M8 3v10M3 8h10' : 'm3 13 1-3 7-7 2 2-7 7-3 1Z')), i < items.length - 1 && h("span", {
        style: {
          flex: 1,
          width: 1,
          background: '#e5e5e5',
          marginTop: 4
        }
      })), h("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, h("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap'
        }
      }, h("b", {
        style: {
          fontSize: 14,
          color: 'rgba(0,0,0,.88)'
        }
      }, r.action), h("span", {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          height: 20,
          padding: '0 7px',
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          fontSize: 11.5,
          color: 'rgba(0,0,0,.65)',
          background: '#fafafa'
        }
      }, h("span", {
        style: {
          width: 5,
          height: 5,
          borderRadius: 9,
          background: 'rgba(0,0,0,.55)'
        }
      }), "มีผล ", dOnly(r.eff || r.at)), h("span", {
        style: {
          flex: 1
        }
      }), h("span", {
        style: {
          fontSize: 12,
          color: 'rgba(0,0,0,.5)',
          whiteSpace: 'nowrap'
        }
      }, tsTxt(r.at))), r.summary && h("div", {
        style: {
          fontSize: 13,
          color: 'rgba(0,0,0,.8)',
          marginTop: 4
        }
      }, r.summary), h("div", {
        style: {
          fontSize: 12,
          color: 'rgba(0,0,0,.5)',
          marginTop: 2
        }
      }, "โดย ", r.by), (r.changes || []).length > 0 && h("div", {
        style: {
          display: 'grid',
          gridTemplateColumns: 'minmax(110px,auto) 1fr',
          gap: '4px 16px',
          marginTop: 8,
          fontSize: 12.5
        }
      }, r.changes.map((c, k) => h(React.Fragment, {
        key: k
      }, h("span", {
        style: {
          color: 'rgba(0,0,0,.55)'
        }
      }, c.field), h("span", {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8
        }
      }, h("span", {
        style: {
          color: 'rgba(0,0,0,.4)',
          textDecoration: c.before && c.before !== '—' ? 'line-through' : 'none'
        }
      }, c.before || '—'), h("span", {
        style: {
          color: 'rgba(0,0,0,.45)'
        }
      }, "›"), h("b", {
        className: "mono"
      }, c.after || '—')))))));
    })), h("div", {
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '12px 20px',
        borderTop: '1px solid #f0f0f0'
      }
    }, h("button", {
      type: "button",
      className: "btn",
      onClick: onClose
    }, "ปิด"))));
  }

  // ─── ปุ่มหัวหน้าจอมาตรฐาน ───
  function PcEditActions({
    recordKey,
    editing,
    setEditing,
    onSave,
    onDiscard,
    title,
    savedDetail
  }) {
    const [hist, setHist] = React.useState(false);
    const [, force] = React.useState(0);
    const has = !!recordKey;
    React.useEffect(() => {
      setEditing(false);
    }, [recordKey]);
    const who = window.LOGIN_USER && window.LOGIN_USER.name || 'มนตรี ศรีสุข';
    const sub = has ? String(recordKey).replace(/^[a-z]+\./, '') : '';
    const rows = has ? HIST[recordKey] = HIST[recordKey] || [{
      at: nowTs().slice(0, 10) + ' 09:30',
      by: who,
      kind: 'create',
      action: 'สร้างรายการ',
      summary: 'สร้างรายการ' + (title ? ' \u201C' + title + '\u201D' : '') + ' \u00B7 ' + sub
    }] : [];
    const last = rows[rows.length - 1];
    const save = () => {
      if (onSave && onSave() === false) return;
      rows.push({
        at: nowTs(),
        by: who,
        kind: 'edit',
        action: 'แก้ไขข้อมูล',
        summary: 'บันทึก' + (title ? ' \u201C' + title + '\u201D' : '') + ' \u00B7 ' + sub
      });
      setEditing(false);
      force(x => x + 1);
      window.pcShowSaved(savedDetail);
    };
    const discard = () => window.pcAskDiscard(() => {
      onDiscard && onDiscard();
      setEditing(false);
    });
    return h("div", {
      className: "pc-edit-actions",
      "data-pc-own": "1"
    }, has && last && !editing && h("span", {
      className: "saved-badge"
    }, label(last.at)), editing ? h(React.Fragment, null, h("button", {
      type: "button",
      className: "btn sm",
      onClick: discard
    }, "ละทิ้ง"), h("button", {
      type: "button",
      className: "btn primary sm",
      onClick: save
    }, h(Icon, {
      name: "check",
      size: 13
    }), " บันทึกข้อมูล")) : h(React.Fragment, null, h("button", {
      type: "button",
      className: "btn sm",
      disabled: !has,
      onClick: () => setHist(true)
    }, h(Icon, {
      name: "history",
      size: 13
    }), " ประวัติ"), h("button", {
      type: "button",
      className: "btn primary sm",
      disabled: !has,
      onClick: () => setEditing(true)
    }, h(Icon, {
      name: "edit",
      size: 13
    }), " แก้ไขข้อมูล")), hist && ReactDOM.createPortal(h(PcHistoryModal, {
      title: title,
      sub: sub,
      rows: rows,
      onClose: () => setHist(false)
    }), document.body));
  }
  window.PcEditActions = PcEditActions;
  window.PcHistoryModal = PcHistoryModal;

  // ─── ทั้งระบบ: "ยกเลิก" → "ละทิ้ง" + ยืนยัน · "บันทึก…" สำเร็จ → แจ้งผล ───
  const DLG = '[role=dialog],[role=alertdialog],.modal-card,.da-modal,.sh-dc-card';
  const isConfirmDlg = b => {
    const d = b.closest(DLG);
    if (!d) return false;
    return Array.prototype.some.call(d.querySelectorAll('button'), x => /ยืนยัน|อนุมัติ|ปิดใช้งาน|เปิดใช้งาน|^\s*ลบ|แก้ไขต่อ/.test(x.textContent));
  };
  const scan = () => {
    if (!pcInScope()) return;
    document.querySelectorAll('button:not([data-pc-seen])').forEach(b => {
      if (b.textContent.trim() !== 'ยกเลิก') return;
      if (b.closest('[data-pc-own]') || b.closest('#pc-guard-root')) return;
      if (isConfirmDlg(b)) return;
      b.setAttribute('data-pc-seen', '1');
      b.setAttribute('data-pc-discard', '1');
      b.childNodes.forEach(n => {
        if (n.nodeType === 3 && n.nodeValue.indexOf('ยกเลิก') >= 0) n.nodeValue = n.nodeValue.replace('ยกเลิก', 'ละทิ้ง');
      });
    });
  };
  let t = null;
  new MutationObserver(() => {
    if (t) return;
    t = requestAnimationFrame(() => {
      t = null;
      scan();
    });
  }).observe(document.body, {
    childList: true,
    subtree: true
  });
  const ERR = '.sr-error,.dep-error,.cfg-error,.da-error,[role=alert]';
  const dialogs = () => Array.prototype.filter.call(document.querySelectorAll(DLG + ',.sh-dc-overlay'), x => x.isConnected);
  const visErr = () => Array.prototype.filter.call(document.querySelectorAll(ERR), x => x.offsetParent !== null);
  const watchSave = btn => {
    const e0 = new Set(visErr());
    const d0 = new Set(dialogs());
    const inDlg = btn.closest(DLG);
    setTimeout(() => {
      const e1 = visErr();
      if (e1.length) return;
      if (document.querySelector('#pc-guard-root *')) return;
      if (dialogs().some(d => !d0.has(d))) return;
      if (inDlg && inDlg.isConnected) return;
      window.pcShowSaved();
    }, 380);
  };
  let bypass = false;
  document.addEventListener('click', e => {
    const tg = e.target && e.target.closest ? e.target : null;
    if (!tg) return;
    if (!pcInScope()) return;
    const b = tg.closest('button[data-pc-discard]');
    if (b && !bypass && !b.disabled && b.textContent.trim() === 'ละทิ้ง') {
      e.preventDefault();
      e.stopPropagation();
      window.pcAskDiscard(() => {
        bypass = true;
        try {
          b.click();
        } finally {
          bypass = false;
        }
      });
      return;
    }
    const s = tg.closest('button');
    if (s && !s.disabled && !s.closest('[data-pc-own]') && !s.closest('#pc-guard-root') && /^บันทึก/.test(s.textContent.trim())) watchSave(s);
  }, true);
})();
