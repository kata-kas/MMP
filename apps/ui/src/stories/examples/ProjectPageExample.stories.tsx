import type { Meta, StoryObj } from '@storybook/react';
import { Header } from '@/core/header/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconFiles, IconSettings } from '@tabler/icons-react';
import { mockProjects, mockAssets } from '../mocks/mockData';
import { MockProviders } from '../mocks/MockProviders';

const meta: Meta = {
  title: 'Examples/ProjectPageExample',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MockProviders>
        <Story />
      </MockProviders>
    ),
  ],
};

export default meta;
type Story = StoryObj;

const mockProject = mockProjects[0];
const mockProjectAssets = mockAssets.filter((a) => a.project_uuid === mockProject.uuid);

export const Complete: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <Header
        title={mockProject.name}
        description={mockProject.description}
        tags={mockProject.tags}
        link={mockProject.external_link}
        imagePath="https://images.unsplash.com/photo-1563520239648-a24e51d4b570?q=80&w=2000&h=400&auto=format&fit=crop"
      />
      <div className="container mx-auto w-full my-2">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">
              <IconFiles className="mr-2 h-3 w-3" />
              All
            </TabsTrigger>
            <TabsTrigger value="model">Models</TabsTrigger>
            <TabsTrigger value="texture">Textures</TabsTrigger>
            <TabsTrigger value="add_asset" className="ml-auto">
              <IconSettings className="mr-2 h-3 w-3" />
              Add Asset
            </TabsTrigger>
            <TabsTrigger value="settings">
              <IconSettings className="mr-2 h-3 w-3" />
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {mockProjectAssets.map((asset) => (
                <Card key={asset.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <IconFiles className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-base">{asset.label || asset.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {asset.asset_type} • {(asset.size / 1024).toFixed(0)} KB
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{asset.extension}</Badge>
                      <Badge variant="outline">{asset.origin}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="model" className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {mockProjectAssets
                .filter((a) => a.asset_type === 'model')
                .map((asset) => (
                  <Card key={asset.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <IconFiles className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-base">{asset.label || asset.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {(asset.size / 1024).toFixed(0)} KB
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="texture" className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {mockProjectAssets
                .filter((a) => a.asset_type === 'texture')
                .map((asset) => (
                  <Card key={asset.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <IconFiles className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-base">{asset.label || asset.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {(asset.size / 1024).toFixed(0)} KB
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="add_asset" className="mt-3 p-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Asset</CardTitle>
                <CardDescription>Upload files to add them to this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <IconFiles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop files here, or click to browse
                  </p>
                  <Button>Select Files</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings" className="mt-3 p-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
                <CardDescription>Manage project details and configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Project Name</label>
                  <p className="text-sm text-muted-foreground mt-1">{mockProject.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-muted-foreground mt-1">{mockProject.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex gap-2 mt-2">
                    {mockProject.tags.map((tag) => (
                      <Badge key={tag.value} variant="secondary">
                        {tag.value}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="pt-4">
                  <Button>Edit Project</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  ),
};

export const Minimal: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <Header title={mockProject.name} description={mockProject.description} />
      <div className="container mx-auto w-full my-2">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="model">Models</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockProjectAssets.slice(0, 3).map((asset) => (
                <Card key={asset.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{asset.label || asset.name}</CardTitle>
                    <CardDescription className="text-xs">{asset.asset_type}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  ),
};

export const EmptyState: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <Header title="Empty Project" description="This project has no assets yet" />
      <div className="container mx-auto w-full my-2">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="add_asset" className="ml-auto">
              <IconSettings className="mr-2 h-3 w-3" />
              Add Asset
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-3">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <IconFiles className="h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">No assets found</CardTitle>
                <CardDescription className="text-center mb-4">
                  Get started by adding your first asset to this project
                </CardDescription>
                <Button>Add Asset</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <Header title="Loading Project..." loading={true} />
      <div className="container mx-auto w-full my-2">
        <div className="space-y-4">
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <div className="aspect-video bg-muted animate-pulse" />
                <CardHeader>
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
};
