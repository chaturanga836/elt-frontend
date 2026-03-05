import { Divider, Select, Typography } from "antd";
import React from "react";
import CursorPagination from "./CursorPagination";
import OffsetPagination from "./OffsetPagination";
import LinkHeaderPagination from "./LinkHeaderPagination";
import PagePagination from "./PagePagination";
import { useConnectionStore } from "@/store/useConnectionStore";
import { SettingType } from "@/types/restForm";
const { Text } = Typography;


const settingOptions = [
    { value: 'cursor', label: 'Cursor Pagination' },
    { value: 'offset', label: 'Offset Pagination' },
    { value: 'link_header', label: 'Link Header Pagination' },
    { value: 'page', label: 'Page Pagination' }
];

export default function FetchSettings() {
    const settingType = useConnectionStore((state) => state.settingType);
    const setSettingType = useConnectionStore((state) => state.setSettingType);

    const renderSettingComponent = () => {
        switch (settingType) {
            case 'cursor': return <CursorPagination />;
            case 'offset': return <OffsetPagination />;
            case 'link_header': return <LinkHeaderPagination />;
            case 'page': return <PagePagination />;

        }
    };

    return (
        <React.Fragment>
            <div className="flex flex-col gap-6 p-2">
                <div className="flex items-center gap-4">
                    <div className="w-1/3">
                        <Text strong className="text-[11px] text-muted-foreground uppercase block mb-1">
                            Auth Type
                        </Text>
                        <Select
                            value={settingType}
                            // 2. This now updates the global store
                            onChange={(value) => setSettingType(value as SettingType)}
                            options={settingOptions}
                            className="w-full"
                            variant="filled"
                        />
                    </div>

                    <div className="flex-1 pt-5">
                        <Text type="secondary" className="text-xs italic">
                            Selected method will be applied to headers/params during execution.
                        </Text>
                    </div>
                </div>
                <Divider className="my-0" />

                {/* The animation remains, but content is now driven by global state */}
                <div className="min-h-50 animate-in fade-in slide-in-from-top-1 duration-300">
                    {renderSettingComponent()}
                </div>
            </div>
        </React.Fragment>
    );
}