// ════════════════════════════════════════════════════════════════════
//  แท็บจัดห้องพัก — หน้ารายละเอียดโครงการ (งานอบรม/สัมมนา)
//  การ์ด "จัดการห้องพัก" 6 หัวข้อ · กริด 2 คอลัมน์ · view/edit mode
//  วางเหนือผังการจัดห้องพักเดิม
// ════════════════════════════════════════════════════════════════════
(function () {
  const R = window.React;
  if (!R) return;

  const VOID_TAGS = { input: 1, img: 1, br: 1, hr: 1, col: 1, area: 1, base: 1, embed: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1 };
  function mapTree(node, fn) {
    if (Array.isArray(node)) return node.map((n) => mapTree(n, fn));
    if (!R.isValidElement(node)) return node;
    const res = fn(node);
    if (res === null) return null;
    if (res !== undefined) return res;
    if (typeof node.type === 'string' && VOID_TAGS[node.type]) return node;
    const kids = node.props && node.props.children;
    if (kids == null || kids === false) return node;
    const arr = Array.isArray(kids) ? kids : [kids];
    return R.cloneElement(node, undefined, ...arr.map((k) => mapTree(k, fn)));
  }
  const textOf = (n) => {
    if (n == null || n === false) return '';
    if (typeof n === 'string' || typeof n === 'number') return String(n);
    if (Array.isArray(n)) return n.map(textOf).join('');
    if (R.isValidElement(n)) return textOf((n.props || {}).children);
    return '';
  };

  const money = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // สถานะเก็บนอก component — กันค่าหายเมื่อหน้าถูก remount
  const store = {
    edit: false,
    mode: 'auto',                 // auto | manual
    stayType: 'twin',
    gender: 'split',
    rooms: '18',
    spare: '2',
    price: '1200',
    allowSingle: true,
    singleFee: '600',
    singleReason: 'ผู้บริหารระดับผู้อำนวยการขึ้นไป',
    accessible: true,
    pairRule: 'dept',
    checkIn: '2569-10-14',
    checkOut: '2569-10-16',
    building: 'อาคาร A — โรงแรมกรุงศรีริเวอร์',
    roomNos: ['301', '302', '303', '304', '305'],
    roomNoDraft: '',
    payMode: 'lump',
    manualRooms: [
      { building: 'อาคาร A', no: '301', type: 'twin' },
      { building: 'อาคาร A', no: '302', type: 'twin' },
      { building: 'อาคาร B', no: '415', type: 'single' },
    ],
  };
  const subs = new Set();
  const notify = () => subs.forEach((fn) => fn());
  const set = (patch) => { Object.assign(store, patch); notify(); };

  const STAY = [{ v: 'twin', l: 'พักคู่' }, { v: 'single', l: 'พักเดี่ยว' }, { v: 'share', l: 'พักรวม' }];
  const PAY = [
    { v: 'lump', l: 'เหมาจ่าย' },
    { v: 'right', l: 'เบิกจ่ายตามสิทธิ์รายบุคคล' },
    { v: 'self', l: 'ผู้เข้าพักจ่ายเองหน้างาน' },
  ];
  const labelOf = (list, v) => (list.find((o) => o.v === v) || {}).l || '—';
  const thDate = (iso) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    const MO = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return Number(d) + ' ' + (MO[Number(m) - 1] || '') + ' ' + y;
  };

  function Sec({ title, children }) {
    return (
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--primary)', paddingBottom: 6,
                      borderBottom: '2px solid var(--primary-50)', marginBottom: 14 }}>{title}</div>
        {children}
      </div>
    );
  }
  function Grid({ children }) {
    return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '14px 24px' }}>{children}</div>;
  }
  function Field({ label, span, children }) {
    return (
      <div style={span ? { gridColumn: '1 / -1' } : undefined}>
        <div className="muted" style={{ fontSize: 12, marginBottom: 5 }}>{label}</div>
        {children}
      </div>
    );
  }
  const Val = ({ children, mono }) => (
    <div style={{ fontSize: 13.5, minHeight: 22, fontFamily: mono ? 'var(--font-mono)' : undefined }}>{children}</div>
  );

  function Radio({ name, value, options, onChange, edit }) {
    if (!edit) return <Val>{labelOf(options, value)}</Val>;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', paddingTop: 2 }}>
        {options.map((o) => (
          <label key={o.v} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, cursor: 'pointer' }}>
            <input type="radio" name={name} checked={value === o.v} onChange={() => onChange(o.v)} />
            <span>{o.l}</span>
          </label>
        ))}
      </div>
    );
  }

  function RoomTabCard() {
    const [, bump] = R.useState(0);
    R.useEffect(() => {
      const fn = () => bump((n) => n + 1);
      subs.add(fn);
      return () => subs.delete(fn);
    }, []);
    const Icon = window.Icon || (() => null);
    const s = store;
    const edit = s.edit;

    const total = (Number(s.rooms) || 0) + (Number(s.spare) || 0);
    const sum = total * (Number(s.price) || 0);

    const num = (k, unit, width) => (
      edit ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input className="cfg-input" type="number" min="0" style={{ width: width || 120, textAlign: 'right' }}
                 value={s[k]} onChange={(e) => set({ [k]: e.target.value })} />
          {unit && <span className="muted" style={{ fontSize: 12.5 }}>{unit}</span>}
        </div>
      ) : <Val mono>{k === 'price' ? money(s[k]) : (s[k] || '—')} <span className="muted" style={{ fontFamily: 'var(--font-sans)' }}>{unit}</span></Val>
    );

    const addRoomNo = () => {
      const v = (s.roomNoDraft || '').trim();
      if (!v) return;
      const parts = v.split(/[,\s]+/).filter(Boolean).filter((p) => !s.roomNos.includes(p));
      set({ roomNos: s.roomNos.concat(parts), roomNoDraft: '' });
    };

    return (
      <div className="search-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>จัดการห้องพัก</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              กำหนดรูปแบบการจัดห้อง จำนวนห้องที่สำรอง และเงื่อนไขการเข้าพักของโครงการ
            </div>
          </div>
          <span style={{ marginLeft: 'auto' }} />
          {edit ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => set({ edit: false })}>ยกเลิก</button>
              <button className="btn primary" onClick={() => set({ edit: false })}>
                <Icon name="check" /> บันทึกห้องพัก
              </button>
            </div>
          ) : (
            <button className="btn primary" onClick={() => set({ edit: true })}>
              <Icon name="edit" /> แก้ไขห้องพัก
            </button>
          )}
        </div>

        {/* แถบสรุป */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, marginTop: 16, padding: '12px 16px',
                      background: 'var(--primary-50)', border: '1px solid var(--primary-100, #d7efe3)', borderRadius: 8 }}>
          {[['ห้องที่ต้องใช้', (Number(s.rooms) || 0) + ' ห้อง'],
            ['ห้องสำรอง', (Number(s.spare) || 0) + ' ห้อง'],
            ['รวมค่าห้อง', money(sum) + ' บาท']].map(([k, v]) => (
            <div key={k}>
              <div className="muted" style={{ fontSize: 11.5 }}>{k}</div>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary-700)' }}>{v}</div>
            </div>
          ))}
        </div>

        <Sec title="จัดการห้องพัก">
          <Grid>
            <Field label="รูปแบบการจัดห้องพัก">
              <Radio name="room-mode" edit={edit} value={s.mode} onChange={(v) => set({ mode: v })}
                     options={[{ v: 'auto', l: 'อัตโนมัติ' }, { v: 'manual', l: 'เลือกห้องเอง' }]} />
            </Field>
            <Field label="รูปแบบการพัก">
              {edit ? (
                <select className="cfg-input" value={s.stayType} onChange={(e) => set({ stayType: e.target.value })}>
                  {STAY.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              ) : <Val>{labelOf(STAY, s.stayType)}</Val>}
            </Field>
            <Field label="แยกเพศผู้เข้าพัก" span>
              <Radio name="room-gender" edit={edit} value={s.gender} onChange={(v) => set({ gender: v })}
                     options={[{ v: 'split', l: 'แยกชาย-หญิง' }, { v: 'mixed', l: 'อนุญาตพักรวมได้กรณีมาด้วยกัน' }]} />
            </Field>
            <Field label="จำนวนห้องพักทั้งหมดที่สำรองไว้">{num('rooms', 'ห้อง')}</Field>
            <Field label="จำนวนห้องพักสำรอง">{num('spare', 'ห้อง')}</Field>
            <Field label="ราคาห้องพักต่อห้อง">{num('price', 'บาท / คืน', 150)}</Field>
          </Grid>

          {s.mode === 'manual' && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>ห้องพักที่เลือกไว้</div>
                <span style={{ marginLeft: 'auto' }} />
                {edit && (
                  <button className="btn sm" onClick={() => set({ manualRooms: s.manualRooms.concat({ building: '', no: '', type: 'twin' }) })}>
                    <Icon name="plus" /> เพิ่มห้องพัก
                  </button>
                )}
              </div>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: '38%' }}>อาคาร / ตึก</th>
                      <th style={{ width: '24%' }}>เลขห้อง</th>
                      <th>รูปแบบพัก</th>
                      {edit && <th className="center" style={{ width: 70 }}>ลบ</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {s.manualRooms.length === 0 ? (
                      <tr><td colSpan={edit ? 4 : 3} className="center muted" style={{ padding: 20 }}>ยังไม่ได้เลือกห้องพัก</td></tr>
                    ) : s.manualRooms.map((r, i) => {
                      const upd = (patch) => set({ manualRooms: store.manualRooms.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                      return (
                        <tr key={i}>
                          <td>{edit ? <input className="cfg-input" value={r.building} placeholder="อาคาร A" onChange={(e) => upd({ building: e.target.value })} /> : r.building || '—'}</td>
                          <td>{edit ? <input className="cfg-input mono" value={r.no} placeholder="301" onChange={(e) => upd({ no: e.target.value })} /> : <span className="mono">{r.no || '—'}</span>}</td>
                          <td>{edit ? (
                            <select className="cfg-input" value={r.type} onChange={(e) => upd({ type: e.target.value })}>
                              {STAY.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                            </select>
                          ) : labelOf(STAY, r.type)}</td>
                          {edit && (
                            <td className="center">
                              <button className="btn ghost" title="ลบห้องพัก"
                                      onClick={() => set({ manualRooms: store.manualRooms.filter((_, j) => j !== i) })}>
                                <Icon name="trash" size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Sec>

        <Sec title="ความต้องการกรณีพิเศษ">
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: edit ? 'pointer' : 'default' }}>
                <input type="checkbox" checked={s.allowSingle} disabled={!edit} onChange={(e) => set({ allowSingle: e.target.checked })} />
                <span>อนุญาตพักเดี่ยว พร้อมระบุเหตุผล</span>
              </label>
              {s.allowSingle && (
                <div style={{ marginTop: 10, marginLeft: 24, display: 'grid',
                              gridTemplateColumns: 'minmax(0,220px) minmax(0,1fr)', gap: '10px 20px' }}>
                  <Field label="ค่าใช้จ่ายส่วนต่าง">
                    {edit ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input className="cfg-input" type="number" min="0" style={{ width: 130, textAlign: 'right' }}
                               value={s.singleFee} onChange={(e) => set({ singleFee: e.target.value })} />
                        <span className="muted" style={{ fontSize: 12.5 }}>บาท / คืน</span>
                      </div>
                    ) : <Val mono>{money(s.singleFee)} <span className="muted" style={{ fontFamily: 'var(--font-sans)' }}>บาท / คืน</span></Val>}
                  </Field>
                  <Field label="เหตุผลที่อนุญาต">
                    {edit ? (
                      <input className="cfg-input" style={{ width: '100%' }} value={s.singleReason}
                             placeholder="ระบุเหตุผล" onChange={(e) => set({ singleReason: e.target.value })} />
                    ) : <Val>{s.singleReason || '—'}</Val>}
                  </Field>
                </div>
              )}
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: edit ? 'pointer' : 'default' }}>
              <input type="checkbox" checked={s.accessible} disabled={!edit} onChange={(e) => set({ accessible: e.target.checked })} />
              <span>ต้องการห้องพักสำหรับผู้พิการ / ผู้สูงอายุ</span>
            </label>
          </div>
        </Sec>

        <Sec title="ข้อมูลการจับคู่และผู้ร่วมห้อง">
          <Grid>
            <Field label="เงื่อนไขการจับคู่คู่พัก" span>
              <Radio name="room-pair" edit={edit} value={s.pairRule} onChange={(v) => set({ pairRule: v })}
                     options={[{ v: 'dept', l: 'จับคู่ตามหน่วยงานเดียวกัน' }, { v: 'province', l: 'จับคู่ตามจังหวัด' }]} />
            </Field>
          </Grid>
        </Sec>

        <Sec title="ข้อมูลการเข้าพัก">
          <Grid>
            <Field label="วันที่เช็คอิน">
              {edit ? <ErpDate value={s.checkIn} onChange={(v) => ((e) => set({ checkIn: e.target.value }))({ target: { value: v } })} className="cfg-input" />
                    : <Val mono>{thDate(s.checkIn)}</Val>}
            </Field>
            <Field label="วันที่เช็คเอ้าท์">
              {edit ? <ErpDate value={s.checkOut} onChange={(v) => ((e) => set({ checkOut: e.target.value }))({ target: { value: v } })} className="cfg-input" />
                    : <Val mono>{thDate(s.checkOut)}</Val>}
            </Field>
          </Grid>
        </Sec>

        <Sec title="ข้อมูลห้องและอาคาร">
          <Grid>
            <Field label="ชื่ออาคาร / ตึก">
              {edit ? <input className="cfg-input" style={{ width: '100%' }} value={s.building}
                             placeholder="อาคาร A" onChange={(e) => set({ building: e.target.value })} />
                    : <Val>{s.building || '—'}</Val>}
            </Field>
            <Field label="หมายเลขห้องพัก">
              {edit && (
                <input className="cfg-input" style={{ width: '100%' }} value={s.roomNoDraft}
                       placeholder="พิมพ์เลขห้องแล้วกด Enter"
                       onChange={(e) => set({ roomNoDraft: e.target.value })}
                       onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRoomNo(); } }}
                       onBlur={addRoomNo} />
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: edit ? 8 : 0 }}>
                {s.roomNos.length === 0 ? <span className="muted" style={{ fontSize: 12.5 }}>—</span>
                  : s.roomNos.map((no) => (
                    <span key={no} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5,
                                            fontFamily: 'var(--font-mono)', background: 'var(--primary-50)',
                                            border: '1px solid var(--primary)', color: 'var(--primary-700)',
                                            borderRadius: 4, padding: '3px 8px 3px 10px' }}>
                      {no}
                      {edit && (
                        <span role="button" aria-label="ลบ" style={{ cursor: 'pointer', opacity: .7 }}
                              onClick={() => set({ roomNos: store.roomNos.filter((x) => x !== no) })}>×</span>
                      )}
                    </span>
                  ))}
              </div>
            </Field>
          </Grid>
        </Sec>

        <Sec title="รูปแบบการชำระเงิน">
          <Grid>
            <Field label="รูปแบบการชำระเงิน">
              {edit ? (
                <select className="cfg-input" value={s.payMode} onChange={(e) => set({ payMode: e.target.value })}>
                  {PAY.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              ) : <Val>{labelOf(PAY, s.payMode)}</Val>}
            </Field>
          </Grid>
        </Sec>
      </div>
    );
  }

  const wrapCache = new WeakMap();

  // แทรกการ์ดใหม่เหนือการ์ด "ผังการจัดห้องพัก" — ต้องมองทะลุเข้า child component
  // (การ์ดนั้นอยู่ใน SemDetail ซึ่งไม่ได้ export ออกมา) จึงห่อ type ของทุก
  // function component ที่พบ แล้ววิเคราะห์ผลลัพธ์ของมันซ้ำ
  function injectRoomCard(node) {
    let hit = false;
    const out = mapTree(node, (el) => {
      if (typeof el.type === 'function') {
        let w = wrapCache.get(el.type);
        if (!w) {
          const inner = el.type;
          w = function (p) { return injectRoomCard(inner(p)); };
          w.displayName = (inner.displayName || inner.name || 'C') + '+room';
          wrapCache.set(el.type, w);
          wrapCache.set(w, w);
        }
        return R.cloneElement(R.createElement(w, el.props), { key: el.key });
      }
      if (hit) return undefined;
      const cn = el.props && el.props.className;
      if (typeof cn !== 'string' || !/search-card/.test(cn)) return undefined;
      if (!/ผังการจัดห้องพัก/.test(textOf(el.props.children))) return undefined;
      hit = true;
      return (
        <R.Fragment>
          <RoomTabCard />
          <div style={{ height: 16 }} />
          {el}
        </R.Fragment>
      );
    });
    return out;
  }

  const install = () => {
    const orig = window.SeminarProjectPage;
    if (!orig) return false;
    if (orig.__roomTab) return true;
    const Patched = function (props) {
      return injectRoomCard(orig(props));
    };
    Patched.__roomTab = true;
    window.SeminarProjectPage = Patched;
    return true;
  };

  if (!install()) {
    let n = 0;
    const t = setInterval(() => { if (install() || ++n > 100) clearInterval(t); }, 100);
  }
})();
