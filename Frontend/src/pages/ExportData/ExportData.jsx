import React, { useState, useEffect } from 'react';
import { Download, Settings, BarChart3, Save, TestTube, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import Sidebar from '../../components/layout/Sildebar';
import { export_sheet, get_mapping, update_mapping } from '../../services/exportService';
const ExportData = () => {
    const [mappings, setMappings] = useState({});
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [exportResult, setExportResult] = useState(null);

    const customerFields = [
        { key: 'full_name', label: 'Họ tên', required: true },
        { key: 'phone_number', label: 'Số điện thoại', required: true },
        { key: 'created_at', label: 'Ngày submit', optional: true },
        { key: 'course', label: 'Khóa học cần đăng ký', optional: true },
        { key: 'student_id', label: 'Cơ sở đăng ký học', optional: true },
        { key: 'address', label: 'Địa chỉ', optional: true },
        { key: 'email', label: 'Email', optional: true },
        { key: 'notes', label: 'Ghi chú', optional: true }
    ];

    // Load mapping khi component mount
    useEffect(() => {
        loadMapping();
    }, []);

    const loadMapping = async () => {
        try {
            setLoading(true);
            const response = await get_mapping();

            let mappingData = {};

            if (Array.isArray(response)) {
                response.forEach((col) => {
                    mappingData[col] = "";
                });
            } else if (response && Object.keys(response).length > 0) {
                mappingData = response;
            } else {
                ["A", "B", "C", "D", "E"].forEach((col) => {
                    mappingData[col] = "";
                });
            }

            setMappings(mappingData);
            showMessage('success', 'Đã tải danh sách cột từ Google Sheet');
        } catch (error) {
            showMessage('error', 'Lỗi khi tải mapping: ' + error.message);
        } finally {
            setLoading(false);
        }
    };


    const handleMappingChange = (column, field) => {
        setMappings(prev => ({ ...prev, [column]: field }));
    };

    const saveMapping = async () => {
        try {
            setLoading(true);
            const response = await update_mapping(mappings); // gửi mappings như { "A": "id", "B": "full_name", ... }
            showMessage('success', response.message || 'Lưu mapping thành công');
        } catch (error) {
            showMessage('error', 'Lỗi khi lưu mapping: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const exportToGoogleSheets = async () => {
        try {
            setExportLoading(true);
            const response = await export_sheet();
            if (response.success) {
                setExportResult(response);
                showMessage('success', `${response.message} (${response.count} bản ghi)`);
            } else {
                throw new Error('Không thể export dữ liệu');
            }
        } catch (error) {
            showMessage('error', 'Lỗi khi export: ' + error.message);
        } finally {
            setExportLoading(false);
        }
    };

    const showMessage = (type, content) => {
        setMessage({ type, content });
        setTimeout(() => {
            setMessage({ type: '', content: '' });
        }, 5000);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            showMessage('success', 'Đã copy link vào clipboard');
        }).catch(() => {
            showMessage('error', 'Không thể copy link');
        });
    };

    const openInNewTab = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const getFieldLabel = (fieldKey) => {
        const field = customerFields.find(f => f.key === fieldKey);
        return field ? field.label : fieldKey;
    };

    const getStatusColor = (field) => {
        const fieldInfo = customerFields.find(f => f.key === field);
        if (!field) return 'bg-gray-100';
        return fieldInfo?.required ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 p-8 bg-gray-50 min-h-screen overflow-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <h1 className="text-xl font-semibold text-gray-900">Ánh xạ với Google Sheets</h1>
                    </div>
                    <p className="text-gray-600 mb-4">Ánh xạ thủ công các trường thông tin với cột Google Sheets</p>

                    {/* Message Display */}
                    {message.content && (
                        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                            'bg-red-50 border border-red-200 text-red-800'
                            }`}>
                            {message.type === 'success' ?
                                <CheckCircle className="w-5 h-5" /> :
                                <AlertCircle className="w-5 h-5" />
                            }
                            <span>{message.content}</span>
                        </div>
                    )}

                    {/* Warning */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">⚠</span>
                            <p className="text-blue-700 text-sm">
                                <strong>Lưu ý:</strong> Bạn cần ánh xạ thủ công các trường thông tin với cột Google Sheets.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mb-4">
                        <button
                            onClick={loadMapping}
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Tải columns từ Lead Sheet
                        </button>

                        <button
                            onClick={exportToGoogleSheets}
                            disabled={exportLoading}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Export dữ liệu
                        </button>
                    </div>

                    {/* Export Result with Excel Link */}
                    {exportResult && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <p className="text-green-800">
                                    <strong>Thành công!</strong> Đã export {exportResult.count} bản ghi sang Google Sheets
                                </p>
                            </div>
                        </div>
                    )}

                    <p className="text-sm text-gray-600 mb-2">
                        Nhấn để tải danh sách cột từ Lead Sheet ID đã cấu hình ở trên
                    </p>
                    <p className="text-sm text-gray-500">
                        💡 Đây là Google Sheet dùng để lưu thông tin leads và cũng để load danh sách columns cho việc ánh xạ
                    </p>
                </div>

                {/* Setup Mapping Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Settings className="w-5 h-5 text-gray-700" />
                        <h2 className="text-lg font-semibold text-gray-900">Thiết lập ánh xạ</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Customer Information Fields */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-lg">📝</span>
                                <h3 className="font-medium text-gray-900">Trường thông tin khách hàng</h3>
                            </div>

                            <div className="space-y-3">
                                {customerFields.map((field) => (
                                    <div key={field.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="font-medium text-gray-700">{field.label}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(field.key)}`}>
                                            {field.required ? 'Bắt buộc' : 'Tùy chọn'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Column Mapping */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-lg">📊</span>
                                <h3 className="font-medium text-gray-900">Ánh xạ</h3>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-3">
                                    {Object.keys(mappings).map((column) => (
                                        <div key={column} className="flex items-center gap-3">
                                            <span className="font-medium text-gray-600 min-w-[32px] text-right">{column}:</span>
                                            <select
                                                value={mappings[column]}
                                                onChange={(e) => handleMappingChange(column, e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                            >
                                                <option value="">-- Chọn trường --</option>
                                                {customerFields.map((field) => (
                                                    <option key={field.key} value={field.key}>
                                                        {field.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Excel Link Display */}
                <div className="mt-3 p-3 bg-white border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">Link Google Sheets:</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={"https://docs.google.com/spreadsheets/d/1eci4KfF4VNQop9j63mnaKys1N3g3gJ3bdWpsgEE4wJs/edit?usp=sharing"}
                            readOnly
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none"
                        />
                        <button
                            onClick={() => openInNewTab("https://docs.google.com/spreadsheets/d/1eci4KfF4VNQop9j63mnaKys1N3g3gJ3bdWpsgEE4wJs/edit?usp=sharing")}
                            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            title="Mở trong tab mới"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Mở
                        </button>
                    </div>
                </div>

                {/* Google Sheets Preview */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                        <h3 className="font-medium text-gray-900">Cột Google Sheets</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Cột</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Trường ánh xạ</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(mappings).map((column) => {
                                    const mappedField = mappings[column];
                                    const fieldInfo = customerFields.find(f => f.key === mappedField);

                                    return (
                                        <tr key={column}>
                                            <td className="border border-gray-300 px-4 py-2">{column}</td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <select
                                                    value={mappedField}
                                                    onChange={(e) => handleMappingChange(column, e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                                >
                                                    <option value="">-- Chọn trường --</option>
                                                    {customerFields.map((field) => (
                                                        <option key={field.key} value={field.key}>
                                                            {field.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {fieldInfo
                                                    ? fieldInfo.required
                                                        ? <span className="text-red-600">Bắt buộc</span>
                                                        : <span className="text-yellow-600">Tùy chọn</span>
                                                    : <span className="text-gray-400">Chưa ánh xạ</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>

                        </table>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={saveMapping}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu cấu hình
                    </button>

                    <button
                        onClick={loadMapping}
                        disabled={loading}
                        className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                        Kiểm tra kết nối
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportData;