// // components/telegramBot/TelegramBotTable.js
// const TelegramBotTable = ({ data = [], onEdit, onDelete }) => {

//     const formatDate = (dateString) => {
//         return new Date(dateString).toLocaleString('vi-VN');
//     };

//     const truncateToken = (token) => {
//         if (!token) return '';
//         return token.length > 20 ? `${token.substring(0, 20)}...` : token;
//     };

//     if (!data.length) {
//         return (
//             <div className="bg-white rounded-lg shadow-md p-8 text-center">
//                 <p className="text-gray-500">Chưa có bot nào được tạo.</p>
//             </div>
//         );
//     }

//     return (
//         <div className="bg-white rounded-lg shadow-md overflow-hidden">
//             <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                     <thead className="bg-gray-50">
//                         <tr>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                 Tên Bot
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                 Token
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                 Mô tả
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                 Trạng thái
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                 Ngày tạo
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                 Thao tác
//                             </th>
//                         </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                         {data.map((bot) => (
//                             <tr key={bot.id} className="hover:bg-gray-50">
//                                 <td className="px-6 py-4 whitespace-nowrap">
//                                     <div className="font-medium text-gray-900">
//                                         {bot.bot_name}
//                                     </div>
//                                 </td>
//                                 <td className="px-6 py-4 whitespace-nowrap">
//                                     <code className="bg-gray-100 px-2 py-1 rounded text-sm">
//                                         {truncateToken(bot.bot_token)}
//                                     </code>
//                                 </td>
//                                 <td className="px-6 py-4">
//                                     <div className="text-sm text-gray-900 max-w-xs truncate">
//                                         {bot.description || 'Không có mô tả'}
//                                     </div>
//                                 </td>
//                                 <td className="px-6 py-4 whitespace-nowrap">
//                                     <span
//                                         className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bot.is_active
//                                             ? 'bg-green-100 text-green-800'
//                                             : 'bg-red-100 text-red-800'
//                                             }`}
//                                     >
//                                         {bot.is_active ? '✅ Hoạt động' : '❌ Tạm dừng'}
//                                     </span>
//                                 </td>
//                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                                     {formatDate(bot.created_at)}
//                                 </td>
//                                 <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                                     <div className="flex gap-2">
//                                         <button
//                                             onClick={() => onEdit(bot)}
//                                             className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
//                                         >
//                                             Sửa
//                                         </button>

//                                     </div>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// };

// export default TelegramBotTable;
// components/telegramPage/TelegramBotCard.js
const TelegramBotCard = ({ data, onEdit }) => {
    if (!data) {
        return (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">Chưa có bot nào được tạo.</p>
            </div>
        );
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString("vi-VN");
    };

    const truncateToken = (token) => {
        if (!token) return "";
        return token.length > 20 ? `${token.substring(0, 20)}...` : token;
    };

    return (
        <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">{data.bot_name}</h2>
                <button
                    onClick={() => onEdit(data)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                    Sửa
                </button>
            </div>

            <div className="space-y-3">
                <div>
                    <span className="font-medium text-gray-600">Token: </span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {truncateToken(data.bot_token)}
                    </code>
                </div>
                <div>
                    <span className="font-medium text-gray-600">Mô tả: </span>
                    <span>{data.description || "Không có mô tả"}</span>
                </div>
                <div>
                    <span className="font-medium text-gray-600">Trạng thái: </span>
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${data.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                            }`}
                    >
                        {data.is_active ? "✅ Hoạt động" : "❌ Tạm dừng"}
                    </span>
                </div>
                <div>
                    <span className="font-medium text-gray-600">Ngày tạo: </span>
                    <span className="text-gray-500">{formatDate(data.created_at)}</span>
                </div>
            </div>
        </div>
    );
};

export default TelegramBotCard;
