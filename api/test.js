// 用于存储日志（注意：Vercel是无服务器的，重启后日志会丢失）
// 生产环境建议使用外部存储服务如数据库、Logtail、Loggly等
const requestLogs = [];

// 日志清理函数（避免内存占用过大）
function cleanOldLogs() {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 保留最近10分钟的日志
  const maxEntries = 1000; // 最多保留1000条记录
  
  // 清理过期日志
  while (requestLogs.length > 0) {
    if (requestLogs[0].timestamp < now - maxAge) {
      requestLogs.shift();
    } else {
      break;
    }
  }
  
  // 清理超过最大数量的日志
  while (requestLogs.length > maxEntries) {
    requestLogs.shift();
  }
}

// 格式化日志条目
function formatLogEntry(req) {
  const timestamp = new Date();
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.socket?.remoteAddress || 
             'unknown';
  
  // 移除敏感信息
  const headers = { ...req.headers };
  delete headers['authorization'];
  delete headers['cookie'];
  delete headers['x-vercel-proxy-signature'];
  delete headers['x-vercel-signature'];
  
  return {
    timestamp: timestamp.toISOString(),
    timestampReadable: timestamp.toLocaleString('zh-CN'),
    method: req.method,
    url: req.url,
    path: req.url.split('?')[0], // 只取路径部分
    query: req.query,
    body: req.body,
    headers: headers,
    ip: ip,
    userAgent: req.headers['user-agent'] || 'unknown',
    referer: req.headers['referer'] || req.headers['referrer'] || 'direct'
  };
}

// 打印日志到控制台（Vercel日志）
function logToConsole(logEntry) {
  const logLine = `[${logEntry.timestampReadable}] ${logEntry.method} ${logEntry.url} - IP: ${logEntry.ip} - UA: ${logEntry.userAgent?.substring(0, 50)}...`;
  console.log(logLine);
  
  // 详细日志（Vercel面板中可以查看）
  console.log('请求详情:', JSON.stringify(logEntry, null, 2));
}

export default function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 记录请求日志
  const logEntry = formatLogEntry(req);
  
  // 记录到内存数组
  requestLogs.push(logEntry);
  
  // 打印到控制台
  logToConsole(logEntry);
  
  // 清理旧日志
  cleanOldLogs();
  
  // 构建响应数据
  const responseData = {
    success: true,
    message: `${req.method} 请求已成功处理`,
    request: {
      timestamp: logEntry.timestamp,
      method: logEntry.method,
      endpoint: logEntry.path,
      query: logEntry.query,
      body: logEntry.body,
      headers: logEntry.headers,
      ip: logEntry.ip,
      userAgent: logEntry.userAgent
    },
    serverInfo: {
      time: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      logsCount: requestLogs.length
    }
  };
  
  // 特殊端点：查看所有日志
  if (req.url === '/api/logs' || req.url === '/api/logs/') {
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: `已记录 ${requestLogs.length} 条请求日志`,
        logs: requestLogs,
        summary: {
          total: requestLogs.length,
          byMethod: requestLogs.reduce((acc, log) => {
            acc[log.method] = (acc[log.method] || 0) + 1;
            return acc;
          }, {}),
          recent: requestLogs.slice(-10) // 最近10条
        }
      });
    }
    
    if (req.method === 'DELETE') {
      const count = requestLogs.length;
      requestLogs.length = 0; // 清空日志
      return res.status(200).json({
        success: true,
        message: `已清空 ${count} 条日志记录`,
        logsCount: requestLogs.length
      });
    }
  }
  
  // 特殊端点：查看请求统计
  if (req.url === '/api/stats' || req.url === '/api/stats/') {
    const stats = {
      totalRequests: requestLogs.length,
      requestsByMethod: {},
      requestsByEndpoint: {},
      recentRequests: requestLogs.slice(-20).map(log => ({
        time: log.timestampReadable,
        method: log.method,
        endpoint: log.path,
        ip: log.ip
      })),
      topIPs: Object.entries(
        requestLogs.reduce((acc, log) => {
          acc[log.ip] = (acc[log.ip] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1]).slice(0, 10)
    };
    
    // 统计按方法和端点
    requestLogs.forEach(log => {
      stats.requestsByMethod[log.method] = (stats.requestsByMethod[log.method] || 0) + 1;
      stats.requestsByEndpoint[log.path] = (stats.requestsByEndpoint[log.path] || 0) + 1;
    });
    
    return res.status(200).json({
      success: true,
      message: '请求统计信息',
      stats: stats,
      timeRange: {
        oldest: requestLogs[0]?.timestampReadable || '无',
        newest: requestLogs[requestLogs.length - 1]?.timestampReadable || '无'
      }
    });
  }
  
  // 特殊端点：导出日志
  if (req.url === '/api/export' || req.url === '/api/export/') {
    const format = req.query.format || 'json';
    
    if (format === 'csv') {
      // CSV格式导出
      const headers = ['时间', '方法', '接口', '参数', 'IP', 'User-Agent'];
      const csvRows = requestLogs.map(log => [
        log.timestampReadable,
        log.method,
        log.path,
        JSON.stringify(log.query),
        log.ip,
        `"${log.userAgent?.replace(/"/g, '""')}"` // 处理CSV中的引号
      ].join(','));
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="request-logs.csv"');
      return res.status(200).send([headers.join(','), ...csvRows].join('\n'));
    }
    
    // 默认JSON格式
    return res.status(200).json({
      success: true,
      count: requestLogs.length,
      logs: requestLogs
    });
  }
  
  // 默认返回请求信息
  res.status(200).json(responseData);
}
