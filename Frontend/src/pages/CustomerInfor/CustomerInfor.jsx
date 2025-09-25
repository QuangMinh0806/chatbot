import React, { useState, useEffect, useMemo } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { format } from "date-fns";
import { getCustomerInfor } from "../../services/userService";

const CustomerTable = () => {
    const [customers, setCustomers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchData = async () => {
            const data = await getCustomerInfor();
            setCustomers(data);
        };
        fetchData();
    }, []);

    const totalPages = Math.ceil(customers.length / itemsPerPage);

    const currentData = useMemo(
        () =>
            customers.slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
            ),
        [customers, currentPage]
    );

    return (
        <div className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 tracking-tight">
                Customer Information
            </h2>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm text-gray-900">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left font-bold uppercase tracking-wider">
                                Chat Session ID
                            </th>
                            <th className="px-6 py-3 text-left font-bold uppercase tracking-wider">
                                Ngày tạo
                            </th>
                            <th className="px-6 py-3 text-left font-bold uppercase tracking-wider">
                                Thông tin khách hàng
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {currentData.map((cust, index) => (
                            <tr
                                key={cust.id}
                                className={`${
                                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                } hover:bg-blue-50 transition-colors duration-200`}
                            >
                                <td className="px-6 py-4 font-bold text-blue-700">
                                    {cust.chat_session_id}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {format(new Date(cust.created_at), "yyyy-MM-dd HH:mm:ss")}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-6">
                                        <div>
                                            <span className="font-bold text-gray-800">Name:</span>{" "}
                                            {cust.customer_data?.name || "N/A"}
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-800">Email:</span>{" "}
                                            {cust.customer_data?.email || "N/A"}
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-800">Phone:</span>{" "}
                                            {cust.customer_data?.phone || "N/A"}
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-800">Address:</span>{" "}
                                            {cust.customer_data?.address || "N/A"}
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-800">Class:</span>{" "}
                                            {cust.customer_data?.class || "N/A"}
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-800">Registration:</span>{" "}
                                            {cust.customer_data?.registration?.toString() || "N/A"}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
                <span className="text-sm text-gray-800 font-medium">
                    Page <span className="font-bold">{currentPage}</span> of{" "}
                    <span className="font-bold">{totalPages}</span>
                </span>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    >
                        <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    >
                        <FiChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerTable;
