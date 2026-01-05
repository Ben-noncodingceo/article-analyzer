export const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文章深度分析器</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .loading-spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen font-sans">
    <div class="container mx-auto px-4 py-8 max-w-3xl">
        <header class="text-center mb-12">
            <h1 class="text-4xl font-bold text-gray-800 mb-2">文章深度分析器</h1>
            <p class="text-gray-600">支持微信公众号、小红书等平台文章一键分析</p>
        </header>

        <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
            <form id="analyzeForm" class="space-y-4">
                <div>
                    <label for="url" class="block text-sm font-medium text-gray-700 mb-1">文章链接</label>
                    <input type="url" id="url" name="url" required
                        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="https://mp.weixin.qq.com/s/...">
                </div>
                <button type="submit" 
                    class="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition duration-200 flex items-center justify-center font-medium">
                    <span id="btnText">开始分析</span>
                    <div id="loading" class="loading-spinner ml-2 hidden"></div>
                </button>
            </form>
            <div id="error" class="hidden mt-4 p-4 bg-red-50 text-red-700 rounded-md text-sm"></div>
        </div>

        <div id="result" class="hidden space-y-6">
            <!-- 摘要 -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-xl font-semibold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">内容摘要</h2>
                <p id="summary" class="text-gray-600 leading-relaxed"></p>
            </div>

            <!-- 关键词 -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-xl font-semibold text-gray-800 mb-4 border-l-4 border-green-500 pl-3">核心关键词</h2>
                <div id="keywords" class="flex flex-wrap gap-2"></div>
            </div>

            <!-- 数据统计 -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-xl font-semibold text-gray-800 mb-4 border-l-4 border-purple-500 pl-3">数据统计</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-gray-50 p-4 rounded text-center">
                        <div class="text-sm text-gray-500 mb-1">浏览量估算</div>
                        <div id="views" class="text-2xl font-bold text-gray-800">-</div>
                    </div>
                    <div class="bg-gray-50 p-4 rounded text-center">
                        <div class="text-sm text-gray-500 mb-1">评论数估算</div>
                        <div id="comments" class="text-2xl font-bold text-gray-800">-</div>
                    </div>
                </div>
                <p class="text-xs text-gray-400 mt-2 text-center">*注：部分平台数据可能为估算值或仅根据内容推断</p>
            </div>
        </div>
    </div>

    <script>
        const form = document.getElementById('analyzeForm');
        const btnText = document.getElementById('btnText');
        const loading = document.getElementById('loading');
        const result = document.getElementById('result');
        const error = document.getElementById('error');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('url').value;
            
            // UI State: Loading
            btnText.textContent = '分析中...';
            loading.classList.remove('hidden');
            result.classList.add('hidden');
            error.classList.add('hidden');
            form.querySelector('button').disabled = true;

            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || '分析请求失败');
                }

                // Render Results
                document.getElementById('summary').textContent = data.summary;
                
                const keywordsContainer = document.getElementById('keywords');
                keywordsContainer.innerHTML = data.keywords.map(k => 
                    \`<span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">\${k}</span>\`
                ).join('');

                document.getElementById('views').textContent = data.stats.views || 'N/A';
                document.getElementById('comments').textContent = data.stats.comments || 'N/A';

                result.classList.remove('hidden');
            } catch (err) {
                error.textContent = err.message;
                error.classList.remove('hidden');
            } finally {
                // UI State: Reset
                btnText.textContent = '开始分析';
                loading.classList.add('hidden');
                form.querySelector('button').disabled = false;
            }
        });
    </script>
</body>
</html>
`;
