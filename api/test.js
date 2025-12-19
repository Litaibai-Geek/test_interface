export default function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 获取请求信息
  const requestInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body,
    cookies: req.cookies,
    // 获取客户端IP
    ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress,
    // Vercel特定信息
    host: req.headers['host'],
    userAgent: req.headers['user-agent']
  };
  
  // 设置响应头
  res.setHeader('Content-Type', 'application/json');
  
  // 根据不同请求方法返回不同格式
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'GET请求成功',
      request: requestInfo,
      note: '尝试使用POST/PUT/DELETE方法发送数据'
    });
  }
  
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    return res.status(200).json({
      message: `${req.method}请求成功`,
      request: requestInfo,
      receivedData: requestInfo.body,
      note: '数据已成功接收'
    });
  }
  
  if (req.method === 'DELETE') {
    return res.status(200).json({
      message: 'DELETE请求成功',
      request: requestInfo,
      note: '删除操作已记录'
    });
  }
  
  // 其他方法
  res.status(200).json({
    message: `请求方法 ${req.method} 已处理`,
    request: requestInfo
  });
}