import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TransferAnalyticsCard({ title, type, rows }) {
  // Filter rows based on type
  const filteredRows = useMemo(() => {
    if (type === "messages") {
      return rows.filter(r => !r.file_name && !(r.file_size > 0));
    } else {
      return rows.filter(r => r.file_name || r.file_size > 0);
    }
  }, [rows, type]);

  // Compute stability metrics
  const stats = useMemo(() => {
    const count = filteredRows.length;
    if (count === 0) {
      return {
        stdDev: 0,
        mean: 0,
        count: 0,
        classification: "No Data",
        colorClass: "text-slate-400 border-slate-700 bg-slate-900/20",
      };
    }

    const transferTimes = filteredRows.map((r) => Number(r.transfer_time_ms || 0));
    const sum = transferTimes.reduce((acc, v) => acc + v, 0);
    const mean = sum / count;

    const variance = transferTimes.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    let classification = "";
    let colorClass = "";

    if (stdDev <= 5) {
      classification = "Excellent";
      colorClass = "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
    } else if (stdDev <= 15) {
      classification = "Good";
      colorClass = "text-cyan-550 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/25";
    } else if (stdDev <= 30) {
      classification = "Moderate";
      colorClass = "text-amber-655 dark:text-amber-400 bg-amber-500/10 border-amber-500/25";
    } else {
      classification = "Poor";
      colorClass = "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25";
    }

    return {
      stdDev,
      mean,
      count,
      classification,
      colorClass,
    };
  }, [filteredRows]);

  // Calculate Min, Max, and Avg for Header
  const chartStats = useMemo(() => {
    if (filteredRows.length === 0) return { min: 0, max: 0, avg: 0 };
    const times = filteredRows.map(r => Number(r.transfer_time_ms || 0));
    return {
      min: Math.min(...times),
      max: Math.max(...times),
      avg: times.reduce((s, v) => s + v, 0) / times.length
    };
  }, [filteredRows]);

  // Map graph data in chronological order
  const chartData = useMemo(() => {
    return filteredRows
      .slice()
      .reverse()
      .map((r) => ({
        id: r.id,
        transferTime: Number(r.transfer_time_ms || 0),
        algorithm: r.encryption_algorithm,
        fileName: r.file_name || null,
        fileSize: r.file_size || null,
        timestamp: new Date(r.timestamp).toLocaleTimeString()
      }));
  }, [filteredRows]);

  // Render placeholder if type is files and count is less than 5
  if (type === "files" && filteredRows.length < 5) {
    return (
      <div className="glass rounded-3xl p-5 border border-slate-700/30 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 animate-[fadeIn_0.5s_ease-out]">
        <div className="w-full flex flex-col">
          <div className="mb-4 flex flex-wrap justify-between items-center gap-2">
            <h3 className="text-base font-bold text-blue-300">{title}</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-200">
              File Transfers Only
            </span>
          </div>
          <div className="flex-grow min-h-[220px] flex flex-col justify-center items-center text-center select-none bg-slate-50 dark:bg-slate-800/10 border-2 border-dashed border-slate-300 dark:border-slate-700/30 rounded-2xl p-6">
            <span className="text-3xl mb-2">📂</span>
            <h4 className="text-sm font-extrabold text-slate-350 dark:text-slate-300 uppercase tracking-wider">No sufficient file transfer data available</h4>
            <p className="text-xs text-slate-450 mt-2 max-w-xs leading-relaxed">
              At least 5 file transfers are required to generate the transmission timeline and stability analytics (current count: {filteredRows.length}).
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-6 shadow-xl border border-slate-700/30 flex flex-col md:flex-row gap-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Chart Section */}
      <div className="flex-grow md:w-3/4 flex flex-col">
        <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-blue-300">{title}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-200 mt-1 inline-block">
              {type === "messages" ? "Text Messages Only" : "File Transfers Only"}
            </span>
          </div>

          {/* Min, Max, Avg Stats Header */}
          <div className="flex gap-4 text-xs font-mono">
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider font-sans">Min</span>
              <span className="font-extrabold text-slate-100">{chartStats.min.toFixed(1)} ms</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider font-sans">Max</span>
              <span className="font-extrabold text-slate-100">{chartStats.max.toFixed(1)} ms</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider font-sans">Average</span>
              <span className="font-extrabold text-slate-100">{chartStats.avg.toFixed(1)} ms</span>
            </div>
          </div>
        </div>
        
        {chartData.length === 0 ? (
          <div className="flex-grow min-h-[250px] grid place-items-center text-slate-400 text-sm">
            No {type === "messages" ? "message" : "file"} transfer data available
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-slate-700)" opacity={0.6} />
                <XAxis 
                  dataKey="id" 
                  stroke="rgb(var(--text-slate-300))" 
                  label={{ value: type === "messages" ? 'Message ID' : 'File ID', position: 'insideBottomRight', offset: -5, fill: 'rgb(var(--text-slate-300))', fontSize: 11 }} 
                />
                <YAxis 
                  stroke="rgb(var(--text-slate-300))" 
                  label={{ value: 'Transfer Time (ms)', angle: -90, position: 'insideLeft', offset: 10, fill: 'rgb(var(--text-slate-300))', fontSize: 11 }} 
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--glass-bg)", border: "1px solid var(--border-slate-700)", borderRadius: "12px", color: "rgb(var(--text-slate-100))" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1 text-slate-100">
                          <p className="font-bold text-blue-300">{type === "messages" ? "Message" : "File"} ID: {item.id}</p>
                          {item.fileName && (
                            <p className="text-slate-200 truncate max-w-[200px]">File: <span className="font-semibold text-slate-100">{item.fileName}</span></p>
                          )}
                          {item.fileSize && (
                            <p className="text-slate-350">Size: <span className="font-semibold text-slate-100">{(item.fileSize / 1024).toFixed(1)} KB</span></p>
                          )}
                          <p className="text-slate-200">Transfer Time: <span className="font-semibold text-emerald-400">{item.transferTime.toFixed(2)} ms</span></p>
                          <p className="text-slate-200">Algorithm: <span className="font-semibold text-cyan-400">{item.algorithm}</span></p>
                          <p className="text-slate-400">Time: {item.timestamp}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="transferTime"
                  stroke={type === "messages" ? "#f59e0b" : "#3b82f6"}
                  strokeWidth={3}
                  dot={{ r: 3, stroke: type === "messages" ? '#f59e0b' : '#3b82f6', strokeWidth: 2, fill: 'var(--bg-slate-900)' }}
                  activeDot={{ r: 6, fill: type === "messages" ? '#f59e0b' : '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Stability Metrics Section (Compact 2-Column Grid style list) */}
      <div className="md:w-1/4 bg-slate-50 dark:bg-slate-900/10 border border-slate-300 dark:border-slate-700/30 rounded-2xl p-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/35 pb-2">
            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest">Stability Specs</h4>
          </div>
          
          {stats.count === 0 ? (
            <div className="flex items-center justify-center text-slate-400 text-sm h-[150px]">
              No metrics available
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-700/10 pb-1.5 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Std Dev</span>
                <span className="font-mono font-extrabold text-slate-100">{stats.stdDev.toFixed(2)} ms</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-700/10 pb-1.5 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average</span>
                <span className="font-mono font-extrabold text-slate-100">{stats.mean.toFixed(1)} ms</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-700/10 pb-1.5 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Count</span>
                <span className="font-mono font-extrabold text-slate-100">{stats.count}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-700/10 pb-1.5 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rating</span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${stats.colorClass}`}>
                  {stats.classification}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-slate-900/5 dark:bg-slate-800/10 border border-slate-750/10 rounded-2xl p-3.5 mt-6">
          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">Summary</span>
          <p className="text-[10px] text-slate-350 mt-1 leading-normal">
            Adaptive QoS metrics derived from message timelines. Stability ratings influence the hysteresis loop parameters.
          </p>
        </div>
      </div>
    </div>
  );
}
