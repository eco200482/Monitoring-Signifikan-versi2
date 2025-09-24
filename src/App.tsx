import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

// Ganti dengan Google Sheet ID kamu
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1aE3TntGir3kpgyt-0skYItqobexzgS8mYxI2cQCcuQ4/gviz/tq?tqx=out:json";

interface Temuan {
  nomor: string;
  pic: string;
  unit: string;
  segmen: string;
  periode: string;
  masalah: string;
  rootcause: string;
  tindak: string;
  kerugian: number;
  pengembalian: number;
  status: string;
}

const statusOptions = [
  "Belum Tindak Lanjut",
  "Proses",
  "Ditindaklanjuti",
  "Selesai",
];

export default function App() {
  const [data, setData] = useState<Temuan[]>([]);

  // fetch data dari Google Sheets
  useEffect(() => {
    fetch(SHEET_URL)
      .then((res) => res.text())
      .then((text) => {
        const json = JSON.parse(text.substr(47).slice(0, -2));
        const rows = json.table.rows.map((r: any) => ({
          nomor: r.c[0]?.v || "",
          pic: r.c[1]?.v || "",
          unit: r.c[2]?.v || "",
          segmen: r.c[3]?.v || "",
          periode: r.c[4]?.v || "",
          masalah: r.c[5]?.v || "",
          rootcause: r.c[6]?.v || "",
          tindak: r.c[7]?.v || "",
          kerugian: Number(r.c[8]?.v || 0),
          pengembalian: Number(r.c[9]?.v || 0),
          status: r.c[10]?.v || "",
        }));
        setData(rows);
      });
  }, []);

  // --- Rekap per Tahun (Tabel 1) ---
  const rekapPerTahun = data.reduce((acc: any, row) => {
    const tahun = row.periode.match(/\d{4}/)?.[0] || "Lainnya";
    if (!acc[tahun]) {
      acc[tahun] = { kerugian: 0, pengembalian: 0 };
    }
    acc[tahun].kerugian += row.kerugian;
    acc[tahun].pengembalian += row.pengembalian;
    return acc;
  }, {});

  // --- Rekap Status (Tabel 2) ---
  const statusPerTahun = data.reduce((acc: any, row) => {
    const tahun = row.periode.match(/\d{4}/)?.[0] || "Lainnya";
    if (!acc[tahun]) {
      acc[tahun] = {
        "Belum Tindak Lanjut": 0,
        Proses: 0,
        Ditindaklanjuti: 0,
        Selesai: 0,
      };
    }
    acc[tahun][row.status] = (acc[tahun][row.status] || 0) + 1;
    return acc;
  }, {});

  // Data PieChart total
  const statusCount = data.reduce((acc: any, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusCount).map(([status, value]) => ({
    name: status,
    value,
  }));
  const colors = ["#e74c3c", "#f39c12", "#3498db", "#2ecc71"];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center mb-6">
        Monitoring Temuan Signifikan
      </h1>

      {/* Tabel 1 */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-bold text-center mb-2">
          Tabel 1 - Rekap Kerugian per Tahun
        </h2>
        <table className="min-w-full border text-center">
          <thead className="bg-red-500 text-white">
            <tr>
              <th className="border p-2">Tahun</th>
              <th className="border p-2">Kerugian</th>
              <th className="border p-2">Pengembalian</th>
              <th className="border p-2">Sisa Kerugian</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(rekapPerTahun).map(([tahun, val]: any) => {
              const sisa = val.kerugian - val.pengembalian;
              return (
                <tr key={tahun}>
                  <td className="border p-2 font-bold">{tahun}</td>
                  <td className="border p-2 text-red-600">
                    Rp {val.kerugian.toLocaleString()}
                  </td>
                  <td className="border p-2 text-green-600">
                    Rp {val.pengembalian.toLocaleString()}
                  </td>
                  <td className="border p-2 text-red-600">
                    Rp {sisa.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tabel 2 */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-bold text-center mb-2">
          Tabel 2 - Status Temuan per Tahun
        </h2>
        <table className="min-w-full border text-center">
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2">Tahun</th>
              <th className="border p-2">Belum Tindak Lanjut</th>
              <th className="border p-2">Proses</th>
              <th className="border p-2">Ditindaklanjuti</th>
              <th className="border p-2">Selesai</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(statusPerTahun).map(([tahun, val]: any) => (
              <tr key={tahun}>
                <td className="border p-2 font-bold">{tahun}</td>
                {statusOptions.map((s) => (
                  <td key={s} className="border p-2">
                    {val[s] || 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* PieChart */}
        <div className="flex justify-center mt-4">
          <PieChart width={400} height={300}>
            <Pie
              data={pieData}
              cx={200}
              cy={150}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </div>

      {/* Tabel 3 */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-bold text-center mb-2">
          Tabel 3 - Detail Temuan
        </h2>
        <table className="min-w-full border text-center text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">No</th>
              <th className="border p-2">PIC</th>
              <th className="border p-2">Unit</th>
              <th className="border p-2">Segmen</th>
              <th className="border p-2">Periode</th>
              <th className="border p-2">Permasalahan</th>
              <th className="border p-2">Rootcause</th>
              <th className="border p-2">Tindak Lanjut</th>
              <th className="border p-2">Kerugian</th>
              <th className="border p-2">Pengembalian</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td className="border p-2">{row.nomor}</td>
                <td className="border p-2">{row.pic}</td>
                <td className="border p-2">{row.unit}</td>
                <td className="border p-2">{row.segmen}</td>
                <td className="border p-2">{row.periode}</td>
                <td className="border p-2">{row.masalah}</td>
                <td className="border p-2">{row.rootcause}</td>
                <td className="border p-2">{row.tindak}</td>
                <td className="border p-2 text-red-600">
                  Rp {row.kerugian.toLocaleString()}
                </td>
                <td className="border p-2 text-green-600">
                  Rp {row.pengembalian.toLocaleString()}
                </td>
                <td className="border p-2">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
