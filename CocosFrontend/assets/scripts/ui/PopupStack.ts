import { Node } from 'cc';

export interface PopupOpenOptions {
    hideSiblings?: boolean;
}

export interface PopupCloseOptions {
    resumePrevious?: boolean;
    destroy?: boolean;
}

export class PopupStack {
    private static readonly stacks = new Map<string, Node[]>();

    static open(node: Node | null | undefined, options: PopupOpenOptions = {}) {
        if (!node?.isValid) {
            return;
        }

        const parent = node.parent ?? null;
        this.activateAncestors(node);
        if (parent?.isValid && options.hideSiblings !== false) {
            for (const child of parent.children) {
                if (child !== node && child.active) {
                    child.active = false;
                }
            }
        }

        node.active = true;
        this.bringToFront(node);
        this.push(node);
    }

    static close(node: Node | null | undefined, options: PopupCloseOptions = {}) {
        if (!node?.isValid) {
            return;
        }

        const parent = node.parent ?? null;
        this.remove(node);

        if (options.destroy) {
            node.removeFromParent();
            node.destroy();
        } else {
            node.active = false;
        }

        if (options.resumePrevious) {
            const previous = this.getLastValid(parent);
            if (previous) {
                this.activateAncestors(previous);
                previous.active = true;
                this.bringToFront(previous);
            }
        }

        this.deactivateParentIfIdle(parent);
    }

    static closeAll(parent: Node | null | undefined, destroy = false) {
        if (!parent?.isValid) {
            return;
        }

        for (const child of parent.children) {
            if (!child.isValid) {
                continue;
            }
            this.remove(child);
            if (destroy) {
                child.removeFromParent();
                child.destroy();
            } else {
                child.active = false;
            }
        }
        this.deactivateParentIfIdle(parent);
    }

    private static push(node: Node) {
        const parent = node.parent ?? null;
        const key = this.getParentKey(parent);
        const stack = this.getCleanStack(parent);
        const existingIndex = stack.indexOf(node);
        if (existingIndex >= 0) {
            stack.splice(existingIndex, 1);
        }
        stack.push(node);
        this.stacks.set(key, stack);
    }

    private static remove(node: Node) {
        for (const [key, stack] of this.stacks) {
            const next = stack.filter(item => item.isValid && item !== node);
            if (next.length > 0) {
                this.stacks.set(key, next);
            } else {
                this.stacks.delete(key);
            }
        }
    }

    private static getLastValid(parent: Node | null): Node | null {
        const stack = this.getCleanStack(parent);
        return stack.length > 0 ? stack[stack.length - 1] : null;
    }

    private static getCleanStack(parent: Node | null): Node[] {
        const key = this.getParentKey(parent);
        const stack = (this.stacks.get(key) ?? []).filter(node => node?.isValid && node.parent === parent);
        if (stack.length > 0) {
            this.stacks.set(key, stack);
        } else {
            this.stacks.delete(key);
        }
        return stack;
    }

    private static getParentKey(parent: Node | null): string {
        return parent?.uuid ?? '__no_parent__';
    }

    private static activateAncestors(node: Node) {
        let current: Node | null = node.parent ?? null;
        while (current) {
            current.active = true;
            current = current.parent;
        }
    }

    private static bringToFront(node: Node) {
        if (node.parent?.isValid) {
            node.setSiblingIndex(node.parent.children.length - 1);
        }
    }

    private static deactivateParentIfIdle(parent: Node | null) {
        if (!parent?.isValid || parent.name === 'Canvas') {
            return;
        }

        const hasActiveChild = parent.children.some(child => child.isValid && child.active);
        if (!hasActiveChild) {
            parent.active = false;
        }
    }
}
