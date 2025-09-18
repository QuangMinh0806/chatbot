const ZaloBotCard = ({ data, onEdit }) => {
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
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
                >
                    Sửa
                </button>
            </div>

            <div className="space-y-3">
                <div>
                    <span className="font-medium text-gray-600">Access Token: </span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {truncateToken(data.access_token)}
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

export default ZaloBotCard;
