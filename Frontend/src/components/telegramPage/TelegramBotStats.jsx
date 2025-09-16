// components/telegramBot/TelegramBotStats.js
const TelegramBotStats = ({ bots = [] }) => {
    const totalBots = bots.length;
    const activeBots = bots.filter(bot => bot.is_active).length;
    const inactiveBots = totalBots - activeBots;

    const stats = [
        {
            title: "Tổng số Bot",
            value: totalBots,
            color: "bg-blue-500",
            icon: "🤖"
        },
        {
            title: "Bot đang hoạt động",
            value: activeBots,
            color: "bg-green-500",
            icon: "✅"
        },
        {
            title: "Bot tạm dừng",
            value: inactiveBots,
            color: "bg-red-500",
            icon: "❌"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">
                                {stat.title}
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stat.value}
                            </p>
                        </div>
                        <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center text-white text-xl`}>
                            {stat.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TelegramBotStats;