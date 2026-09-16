/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Codicon } from '../../../../base/common/codicons.js';
import { URI } from '../../../../base/common/uri.js';
import { localize, localize2 } from '../../../../nls.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { IConfigurationRegistry, Extensions as ConfigurationExtensions, ConfigurationScope } from '../../../../platform/configuration/common/configurationRegistry.js';
import { ContextKeyExpr } from '../../../../platform/contextkey/common/contextkey.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { Extensions as QuickAccessExtensions, IQuickAccessRegistry } from '../../../../platform/quickinput/common/quickAccess.js';
import { IQuickInputService } from '../../../../platform/quickinput/common/quickInput.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { registerIcon } from '../../../../platform/theme/common/iconRegistry.js';
import { registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { Extensions as ViewExtensions, IViewContainersRegistry, IViewsRegistry } from '../../../common/views.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';
import { NavigatorQuickPick } from '../../../services/workspaceNavigator/browser/navigatorQuickPick.js';
import { WorkspaceNavigatorService } from '../../../services/workspaceNavigator/browser/workspaceNavigatorService.js';
import { IWorkspaceNavigatorService, NAVIGATOR_OPEN_COMMAND, NAVIGATOR_PREFIX, NAVIGATOR_QUICK_OPEN_COMMAND, NAVIGATOR_VIEW_ID } from '../../../services/workspaceNavigator/common/workspaceNavigator.js';
import { NavigatorView } from './navigatorView.js';

registerSingleton(IWorkspaceNavigatorService, WorkspaceNavigatorService, InstantiationType.Delayed);

const enabled = ContextKeyExpr.equals('config.workspaceNavigator.enabled', true);
const icon = registerIcon('workspace-navigator', Codicon.compass, localize('navigator.icon', "Workspace Navigator view icon."));

class NavigatorContribution {
	static readonly ID = 'workbench.contrib.workspaceNavigator';

	constructor() {
		const container = Registry.as<IViewContainersRegistry>(ViewExtensions.ViewContainersRegistry).get('workbench.view.explorer');
		if (container) {
			Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry).registerViews([{
				id: NAVIGATOR_VIEW_ID,
				name: localize2('navigator.viewName', "Workspace navigator"),
				ctorDescriptor: new SyncDescriptor(NavigatorView),
				containerIcon: icon,
				canToggleVisibility: true,
				canMoveView: true,
				when: enabled,
				collapsed: false,
				order: 3,
				weight: 40
			}], container);
		}
	}
}

registerWorkbenchContribution2(NavigatorContribution.ID, NavigatorContribution, WorkbenchPhase.BlockStartup);

Registry.as<IQuickAccessRegistry>(QuickAccessExtensions.Quickaccess).registerQuickAccessProvider({
	ctor: NavigatorQuickPick,
	prefix: NAVIGATOR_PREFIX,
	when: enabled,
	placeholder: localize('navigator.quickInput', "Search files in Workspace Navigator"),
	helpEntries: [{
		description: localize('navigator.quickHelp', "Go to File in Workspace Navigator"),
		commandId: NAVIGATOR_QUICK_OPEN_COMMAND
	}]
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: NAVIGATOR_OPEN_COMMAND,
			title: localize2('navigator.openCommand', "Open in Workspace Navigator"),
			f1: true,
			precondition: enabled,
			icon
		});
	}

	async run(accessor: ServicesAccessor, resource?: URI): Promise<void> {
		const view = await accessor.get(IViewsService).openView<NavigatorView>(NAVIGATOR_VIEW_ID, true);
		if (view && URI.isUri(resource)) {
			view.reveal(resource);
		}
	}
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: NAVIGATOR_QUICK_OPEN_COMMAND,
			title: localize2('navigator.quickCommand', "Quick Open with Workspace Navigator"),
			f1: true,
			precondition: enabled,
			icon
		});
	}

	run(accessor: ServicesAccessor): void {
		accessor.get(IQuickInputService).quickAccess.show(NAVIGATOR_PREFIX);
	}
});

Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration).registerConfiguration({
	id: 'workspaceNavigator',
	title: localize('navigator.configuration', "Workspace Navigator"),
	type: 'object',
	scope: ConfigurationScope.WINDOW,
	properties: {
		'workspaceNavigator.enabled': {
			type: 'boolean',
			default: false,
			tags: ['experimental'],
			description: localize('navigator.enabled', "Show the experimental Workspace Navigator view in Explorer.")
		},
		'workspaceNavigator.useInQuickOpen': {
			type: 'boolean',
			default: false,
			tags: ['experimental'],
			description: localize('navigator.useInQuickOpen', "Use Workspace Navigator discovery in Go to File when Workspace Navigator is enabled.")
		},
		'workspaceNavigator.maxResults': {
			type: 'number',
			default: 200,
			minimum: 1,
			maximum: 1000,
			description: localize('navigator.maxResults', "Maximum number of results displayed by Workspace Navigator.")
		}
	}
});
