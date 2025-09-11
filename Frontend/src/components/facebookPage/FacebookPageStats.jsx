const FacebookPageStats = ({ pages }) => {
    const total = pages.length;
    const active = pages.filter(p => p.is_active).length;
    const inactive = total - active;

    const stats = [
        {
            title: 'Tổng Fanpages',
            value: total,
            icon: '📘',
            bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
            textColor: 'text-blue-600',
            borderColor: 'border-blue-200',
            iconBg: 'bg-blue-500'
        },
        {
            title: 'Đang Hoạt Động',
            value: active,
            icon: '✅',
            bgColor: 'bg-gradient-to-br from-green-50 to-emerald-100',
            textColor: 'text-green-600',
            borderColor: 'border-green-200',
            iconBg: 'bg-green-500'
        },
        {
            title: 'Tạm Dừng',
            value: inactive,
            icon: '⏸️',
            bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
            textColor: 'text-red-600',
            borderColor: 'border-red-200',
            iconBg: 'bg-red-500'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
                <div key={index} className={`${stat.bgColor} ${stat.borderColor} border-2 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center shadow-md`}>
                                    <span className="text-white text-xl">{stat.icon}</span>
                                </div>
                                <h3 className="font-semibold text-gray-700 text-sm">{stat.title}</h3>
                            </div>
                            <p className={`text-4xl font-bold ${stat.textColor} mb-2`}>{stat.value}</p>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 ${stat.iconBg} rounded-full`}></div>
                                <span className="text-sm text-gray-600">
                                    {index === 0 && 'Tổng số fanpage'}
                                    {index === 1 && 'Sẵn sàng nhận tin nhắn'}
                                    {index === 2 && 'Không hoạt động'}
                                </span>
                            </div>
                        </div>

                        {/* Progress indicator */}
                        <div className="text-right">
                            <div className="text-2xl opacity-20">
                                {stat.icon}
                            </div>
                            {index === 1 && total > 0 && (
                                <div className="mt-2 text-xs text-gray-500">
                                    {Math.round((active / total) * 100)}%
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FacebookPageStats;