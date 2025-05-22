import React, {useState} from 'react';

interface CollapsibleProps {
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

const Collapsible: React.FC<CollapsibleProps> = ({
                                                     title,
                                                     children,
                                                     defaultExpanded = true
                                                 }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div style={{
            border: '1px solid #ccc',
            borderRadius: '5px',
            marginBottom: '15px',
            overflow: 'hidden'
        }}>
            <div
                onClick={toggleExpand}
                style={{
                    padding: '10px 15px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: isExpanded ? '1px solid #eee' : 'none' // Separator that appears only when expanded
                }}
            >
                <h2 style={{margin: 0, fontSize: '16px'}}>{title}</h2>
                <div
                    style={{
                        transition: 'transform 0.3s ease-in-out',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                >
                    ▼
                </div>
            </div>
            <div
                style={{
                    padding: isExpanded ? '15px' : '0 15px',
                    maxHeight: isExpanded ? '1000px' : '0',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease-in-out',
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default Collapsible;