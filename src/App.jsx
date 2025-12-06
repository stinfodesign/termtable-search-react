import React, { useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'

const COLUMNS = [
  'Term',
  'Abbreviation',
  'Japanese',
  'Definition',
  'Notes',
  'Classification',
  'Document',
  'Clause',
  'Source',
  'Status',
  'Previous',
  'Next',
]

const normalizeHeaderKey = (s) =>
  (s ?? '')
    .toString()
    .trim()
    .replace(/\u3000/g, ' ')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()

const HEADER_ALIASES = new Map([
  ['term', 'Term'],
  ['abbreviation', 'Abbreviation'],
  ['japanese', 'Japanese'],
  ['definition', 'Definition'],
  ['notes', 'Notes'],
  ['classification', 'Classification'],
  ['standard', 'Document'],
  ['document', 'Document'],
  ['clause', 'Clause'],
  ['source', 'Source'],
  ['status', 'Status'],
  ['previous version', 'Previous'],
  ['prev version', 'Previous'],
  ['previous', 'Previous'],
  ['prev', 'Previous'],
  ['previousversion', 'Previous'],
  ['prevversion', 'Previous'],
  ['next version', 'Next'],
  ['next', 'Next'],
  ['nextversion', 'Next'],
])

const normalize = (s) =>
  (s ?? '')
    .toString()
    .trim()
    .replace(/\u3000/g, ' ')
    .toLowerCase()

export default function App() {
  const fileInputRef = useRef(null)
  const [rows, setRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [field, setField] = useState('Term')
  const [match, setMatch] = useState('partial')
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [sheetName, setSheetName] = useState('')

  const handleFile = async (file) => {
    if (!file) return
    setFileName(file.name)
    setCurrentPage(1)

    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const firstSheet = wb.SheetNames[0]
    setSheetName(firstSheet || '')
    const ws = wb.Sheets[firstSheet]

    const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })

    const normalized = raw.map((row) => {
      const mapped = {}
      Object.keys(row).forEach((k) => {
        const key = normalizeHeaderKey(k)
        const canonical = HEADER_ALIASES.get(key)
        if (canonical) mapped[canonical] = row[k]
      })

      const out = {}
      COLUMNS.forEach((c) => {
        out[c] = mapped[c] ?? ''
      })
      return out
    })

    setRows(normalized)
  }

  const onChooseFile = (e) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const onDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const onDragOver = (e) => e.preventDefault()

  const filtered = useMemo(() => {
    const q = normalize(query)
    if (!q) return rows

    const key = field
    return rows.filter((r) => {
      const val = normalize(r[key])
      if (match === 'exact') return val === q
      return val.includes(q)
    })
  }, [rows, query, field, match])

  const sortedFiltered = useMemo(() => {
    const arr = [...filtered]

    arr.sort((a, b) => {
      const sa = (a.Document || '').toString().trim().toLowerCase()
      const sb = (b.Document || '').toString().trim().toLowerCase()

      if (!sa && sb) return 1
      if (sa && !sb) return -1
      if (sa && sb) {
        const cmp = sa.localeCompare(sb, 'en', { numeric: true })
        if (cmp !== 0) return cmp
      }

      const ca = (a.Clause || '').toString().trim().toLowerCase()
      const cb = (b.Clause || '').toString().trim().toLowerCase()

      if (!ca && cb) return 1
      if (ca && !cb) return -1
      if (!ca && !cb) return 0

      return ca.localeCompare(cb, 'en', { numeric: true })
    })

    return arr
  }, [filtered])

  const total = sortedFiltered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(currentPage, pageCount)

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedFiltered.slice(start, start + pageSize)
  }, [sortedFiltered, page, pageSize])

  const clearFile = () => {
    setRows([])
    setFileName('')
    setSheetName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="container">
      <header>
        <h1>TermTable検索Reactアプリ</h1>
        <p className="subtitle">
          Document（旧 Standard）と Clause でソートされた用語一覧。
        </p>
      </header>

      <section className="card">
        <h2>1) ファイル読込</h2>

        <div
          className="dropzone"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <strong>TermTable2.xlsx</strong> をドラッグ＆ドロップ
        </div>

        <div className="fileRow">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={onChooseFile}
          />
          {fileName ? (
            <>
              <span className="fileInfo">
                読み込み: <strong>{fileName}</strong>
                {sheetName && `（シート: ${sheetName}）`}
                ／ 総件数: {rows.length}
              </span>
              <button className="ghost" onClick={clearFile}>クリア</button>
            </>
          ) : (
            <span className="fileInfo">ファイル未選択</span>
          )}
        </div>
      </section>

      <section className="card">
        <h2>2) 検索</h2>

        <div className="controls">
          <label>
            検索対象：
            <select
              value={field}
              onChange={(e) => { setField(e.target.value); setCurrentPage(1) }}
            >
              <option value="Term">Term</option>
              <option value="Japanese">Japanese</option>
            </select>
          </label>

          <label>
            照合：
            <select
              value={match}
              onChange={(e) => { setMatch(e.target.value); setCurrentPage(1) }}
            >
              <option value="partial">部分一致</option>
              <option value="exact">完全一致</option>
            </select>
          </label>

          <label className="grow">
            キーワード：
            <input
              type="search"
              value={query}
              placeholder="例: feature / 地物"
              onChange={(e) => { setQuery(e.target.value); setCurrentPage(1) }}
            />
          </label>

          <label>
            1ページ件数：
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
            >
              <option>25</option>
              <option>50</option>
              <option>100</option>
              <option>200</option>
            </select>
          </label>
        </div>

        <div className="summary">
          表示件数：<strong>{total}</strong>
        </div>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="empty">
                    該当レコードなし
                  </td>
                </tr>
              ) : (
                pageRows.map((row, i) => (
                  <tr key={`${i}-${row.Term}`}>
                    {COLUMNS.map((c) => (
                      <td key={c}>{String(row[c] ?? '')}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <button disabled={page <= 1} onClick={() => setCurrentPage(1)}>
            « 先頭
          </button>
          <button disabled={page <= 1} onClick={() => setCurrentPage(p => p - 1)}>
            前へ
          </button>
          <span>{page} / {pageCount}</span>
          <button disabled={page >= pageCount} onClick={() => setCurrentPage(p => p + 1)}>
            次へ
          </button>
          <button disabled={page >= pageCount} onClick={() => setCurrentPage(pageCount)}>
            末尾 »
          </button>
        </div>
      </section>

      <footer>
        <small>
          Document（旧 Standard）、Previous / Next（旧 version 系）に対応。
          表記ゆれも自動吸収します。
        </small>
      </footer>
    </div>
  )
}
