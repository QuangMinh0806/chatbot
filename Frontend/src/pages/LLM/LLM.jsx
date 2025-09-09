import Sidebar from '../../components/layout/Sildebar';
import ConfigAI from './ConfigAI';
import ChatChanel from './ChatChanel';

const LLM = () => {
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 p-8 bg-gray-50 min-h-screen overflow-auto">
                {/* AI Configuration Section */}
                <ConfigAI llmId={5} />
                <ChatChanel />
            </div>
        </div>
    );
};

export default LLM;