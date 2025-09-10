const FacebookPageStats = ({ pages }) => {
    const total = pages.length;
    const active = pages.filter(p => p.is_active).length;
    const inactive = total - active;

    return (
        <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white shadow rounded p-4 text-center">
                <p className="text-xl font-bold">{total}</p>
                <p className="text-gray-500">Tổng Fanpages</p>
            </div>
            <div className="bg-white shadow rounded p-4 text-center">
                <p className="text-xl font-bold text-green-600">{active}</p>
                <p className="text-gray-500">Đang Hoạt Động</p>
            </div>
            <div className="bg-white shadow rounded p-4 text-center">
                <p className="text-xl font-bold text-red-600">{inactive}</p>
                <p className="text-gray-500">Tạm Dừng</p>
            </div>
        </div>
    );
};

export default FacebookPageStats;
