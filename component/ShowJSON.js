import { createRoot } from 'react-dom/client';
import React from 'react';
import JSONView from './JSONView';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog';

let root = null;
function getRoot() {
    if (root == null) {
        root = createRoot(document.getElementById('json-id'));
    }
    return root;
}
function showJSON(title, data) {
    getRoot().render(<ModelJSON data={data} title={title} show={true} />);
}

function hideJSON(title, data) {
    if (root != null) {
        root.render(<></>);
    }
}

export { showJSON, hideJSON };

class ModelJSON extends React.Component {
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            show: true,
        };
    }
    show = async () => {
        this.setState({ show: true });
    };
    render() {
        return (
            <Dialog
                open={this.state.show}
                onOpenChange={(open) => this.setState({ show: open })}
            >
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{this.props.title}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-auto px-1">
                        <JSONView str={this.props.data} />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }
}
