import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "./table";

const meta: Meta<typeof Table> = {
	title: "Components/UI/Table",
	component: Table,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Table component with header, body, footer, and caption subcomponents.",
			},
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
	render: () => (
		<Table className="w-[500px]">
			<TableCaption>A list of your recent invoices.</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead className="w-[100px]">Invoice</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Method</TableHead>
					<TableHead className="text-right">Amount</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell className="font-medium">INV001</TableCell>
					<TableCell>Paid</TableCell>
					<TableCell>Credit Card</TableCell>
					<TableCell className="text-right">$250.00</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">INV002</TableCell>
					<TableCell>Pending</TableCell>
					<TableCell>PayPal</TableCell>
					<TableCell className="text-right">$150.00</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">INV003</TableCell>
					<TableCell>Unpaid</TableCell>
					<TableCell>Bank Transfer</TableCell>
					<TableCell className="text-right">$350.00</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">INV004</TableCell>
					<TableCell>Paid</TableCell>
					<TableCell>Credit Card</TableCell>
					<TableCell className="text-right">$450.00</TableCell>
				</TableRow>
			</TableBody>
			<TableFooter>
				<TableRow>
					<TableCell colSpan={3}>Total</TableCell>
					<TableCell className="text-right">$1,200.00</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
	),
};

export const WithoutFooter: Story = {
	render: () => (
		<Table className="w-[500px]">
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Email</TableHead>
					<TableHead>Role</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell className="font-medium">John Doe</TableCell>
					<TableCell>john@example.com</TableCell>
					<TableCell>Admin</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">Jane Smith</TableCell>
					<TableCell>jane@example.com</TableCell>
					<TableCell>User</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">Bob Johnson</TableCell>
					<TableCell>bob@example.com</TableCell>
					<TableCell>User</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
};

export const WithActions: Story = {
	render: () => (
		<Table className="w-[600px]">
			<TableHeader>
				<TableRow>
					<TableHead>Product</TableHead>
					<TableHead>Price</TableHead>
					<TableHead>Stock</TableHead>
					<TableHead className="text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell className="font-medium">Product A</TableCell>
					<TableCell>$29.99</TableCell>
					<TableCell>50</TableCell>
					<TableCell className="text-right">
						<Button variant="ghost" size="sm">
							Edit
						</Button>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">Product B</TableCell>
					<TableCell>$39.99</TableCell>
					<TableCell>30</TableCell>
					<TableCell className="text-right">
						<Button variant="ghost" size="sm">
							Edit
						</Button>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">Product C</TableCell>
					<TableCell>$49.99</TableCell>
					<TableCell>20</TableCell>
					<TableCell className="text-right">
						<Button variant="ghost" size="sm">
							Edit
						</Button>
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
};
